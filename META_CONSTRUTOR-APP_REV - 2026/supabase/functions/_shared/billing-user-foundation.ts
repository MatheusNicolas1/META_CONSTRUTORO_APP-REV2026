const ORG_LOOKUP_ATTEMPTS = 8;
const ORG_LOOKUP_RETRY_MS = 500;
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
export const cleanText = (value)=>{
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};
const normalizeOrgName = (value)=>{
  const trimmed = (value || "Minha Empresa").trim();
  if (trimmed.length < 2) return "Minha Empresa";
  return trimmed.slice(0, 100);
};
const toOrgSlug = (name, userId)=>{
  const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const safeBase = base || "org";
  return `${safeBase}-${userId.slice(0, 8)}`;
};
const createReferralCode = (userId)=>`${userId.replace(/-/g, "").slice(0, 6)}${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`.slice(0, 12);
const findBillingOrgMember = async (supabaseAdmin, userId)=>{
  const { data, error } = await supabaseAdmin.from("org_members").select("org_id").eq("user_id", userId).eq("status", "active").in("role", [
    "Presidente",
    "Administrador"
  ]).order("created_at", {
    ascending: true
  }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
};
const resolveUniqueProfileValue = async (supabaseAdmin, column, rawValue, userId)=>{
  const value = cleanText(rawValue);
  if (!value) return null;
  const { data, error } = await supabaseAdmin.from("profiles").select("id").eq(column, value).limit(1).maybeSingle();
  if (error) throw error;
  if (data?.id && data.id !== userId) return null;
  return value;
};
const getProfile = async (supabaseAdmin, userId)=>{
  const { data, error } = await supabaseAdmin.from("profiles").select("id, stripe_customer_id, email, name, company, phone, cpf_cnpj, plan_type, terms_accepted_at").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
};
const ensureProfile = async (supabaseAdmin, user, checkoutProfile = {})=>{
  const existingProfile = await getProfile(supabaseAdmin, user.id);
  const metadata = user.user_metadata ?? {};
  const now = new Date().toISOString();
  const email = cleanText(user.email) ?? cleanText(existingProfile?.email);
  const name = cleanText(checkoutProfile.name) ?? cleanText(existingProfile?.name) ?? cleanText(metadata.name) ?? cleanText(metadata.full_name) ?? cleanText(metadata.display_name) ?? email ?? "Usuario";
  const company = cleanText(checkoutProfile.company) ?? cleanText(existingProfile?.company);
  const phone = await resolveUniqueProfileValue(supabaseAdmin, "phone", cleanText(checkoutProfile.phone) ?? cleanText(existingProfile?.phone) ?? cleanText(metadata.phone), user.id);
  const cpfCnpj = await resolveUniqueProfileValue(supabaseAdmin, "cpf_cnpj", cleanText(checkoutProfile.cpf_cnpj) ?? cleanText(existingProfile?.cpf_cnpj) ?? cleanText(metadata.cpf_cnpj), user.id);
  if (!existingProfile) {
    const insertPayload = {
      id: user.id,
      name,
      email,
      company,
      phone,
      cpf_cnpj: cpfCnpj,
      plan_type: "free",
      referral_code: createReferralCode(user.id),
      terms_accepted_at: now,
      created_at: now,
      updated_at: now
    };
    const { data, error } = await supabaseAdmin.from("profiles").insert(insertPayload).select("id, stripe_customer_id, email, name, company, phone, cpf_cnpj, plan_type, terms_accepted_at").single();
    if (error) throw error;
    return data;
  }
  const updatePayload = {
    email,
    name,
    updated_at: now
  };
  if (company !== cleanText(existingProfile.company)) updatePayload.company = company;
  if (phone) updatePayload.phone = phone;
  if (cpfCnpj) updatePayload.cpf_cnpj = cpfCnpj;
  if (!cleanText(existingProfile.plan_type)) updatePayload.plan_type = "free";
  if (!existingProfile.terms_accepted_at) updatePayload.terms_accepted_at = now;
  const { data, error } = await supabaseAdmin.from("profiles").update(updatePayload).eq("id", user.id).select("id, stripe_customer_id, email, name, company, phone, cpf_cnpj, plan_type, terms_accepted_at").single();
  if (error) throw error;
  return data;
};
const ensureUserRole = async (supabaseAdmin, userId)=>{
  const { data, error } = await supabaseAdmin.from("user_roles").select("id, role").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw error;
  if (data?.id) return;
  const { error: insertError } = await supabaseAdmin.from("user_roles").insert({
    user_id: userId,
    role: "Administrador"
  });
  if (insertError && insertError.code !== "23505") throw insertError;
};
const ensureUserSettings = async (supabaseAdmin, userId)=>{
  const { data, error } = await supabaseAdmin.from("user_settings").select("id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw error;
  if (data?.id) return;
  const { error: insertError } = await supabaseAdmin.from("user_settings").insert({
    user_id: userId
  });
  if (insertError && insertError.code !== "23505") throw insertError;
};
const ensureUserCredits = async (supabaseAdmin, userId)=>{
  const { data, error } = await supabaseAdmin.from("user_credits").select("id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw error;
  if (data?.id) return;
  const { error: insertError } = await supabaseAdmin.from("user_credits").insert({
    user_id: userId,
    credits_balance: 7,
    plan_type: "free"
  });
  if (insertError && insertError.code !== "23505") throw insertError;
};
const ensureBillingOrgMember = async (supabaseAdmin, userId, orgNameHint)=>{
  const existingMember = await findBillingOrgMember(supabaseAdmin, userId);
  if (existingMember?.org_id) return existingMember;
  const { data: existingOrg, error: existingOrgError } = await supabaseAdmin.from("orgs").select("id").eq("owner_user_id", userId).order("created_at", {
    ascending: true
  }).limit(1).maybeSingle();
  if (existingOrgError) throw existingOrgError;
  let orgId = existingOrg?.id;
  if (!orgId) {
    const orgName = normalizeOrgName(orgNameHint);
    const { data: createdOrg, error: createOrgError } = await supabaseAdmin.from("orgs").insert({
      name: orgName,
      slug: toOrgSlug(orgName, userId),
      owner_user_id: userId
    }).select("id").single();
    if (createOrgError) throw createOrgError;
    orgId = createdOrg.id;
  }
  const { error: memberError } = await supabaseAdmin.from("org_members").upsert({
    org_id: orgId,
    user_id: userId,
    role: "Administrador",
    status: "active",
    joined_at: new Date().toISOString()
  }, {
    onConflict: "org_id,user_id"
  });
  if (memberError) throw memberError;
  return {
    org_id: orgId
  };
};
const waitForBillingOrgMember = async (supabaseAdmin, userId)=>{
  for(let attempt = 1; attempt <= ORG_LOOKUP_ATTEMPTS; attempt += 1){
    const orgMember = await findBillingOrgMember(supabaseAdmin, userId);
    if (orgMember?.org_id) return orgMember;
    if (attempt < ORG_LOOKUP_ATTEMPTS) {
      await sleep(ORG_LOOKUP_RETRY_MS);
    }
  }
  return null;
};
export const ensureBillingUserFoundation = async (supabaseAdmin, user, checkoutProfile = {})=>{
  const profile = await ensureProfile(supabaseAdmin, user, checkoutProfile);
  await Promise.all([
    ensureUserRole(supabaseAdmin, user.id),
    ensureUserSettings(supabaseAdmin, user.id),
    ensureUserCredits(supabaseAdmin, user.id)
  ]);
  const orgNameHint = cleanText(checkoutProfile.company) ?? cleanText(profile?.company) ?? cleanText(checkoutProfile.name) ?? cleanText(profile?.name) ?? cleanText(user.user_metadata?.name) ?? cleanText(user.email);
  const orgMember = await waitForBillingOrgMember(supabaseAdmin, user.id) ?? await ensureBillingOrgMember(supabaseAdmin, user.id, orgNameHint);
  if (!orgMember?.org_id) {
    throw new Error("Organization not found for user after signup provisioning");
  }
  return {
    profile,
    orgMember
  };
};
export const saveStripeCustomerId = async (supabaseAdmin, userId, stripeCustomerId)=>{
  const { data, error } = await supabaseAdmin.from("profiles").update({
    stripe_customer_id: stripeCustomerId,
    updated_at: new Date().toISOString()
  }).eq("id", userId).select("id, stripe_customer_id, email, name, company, phone, cpf_cnpj, plan_type, terms_accepted_at").single();
  if (error) throw error;
  return data;
};
