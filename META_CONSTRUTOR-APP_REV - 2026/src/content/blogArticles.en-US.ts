/**
 * Blog Articles — English (US)
 * Translated blog articles for English-speaking audience.
 * Auto-translated via AI pipeline.
 */

import { BlogArticle } from "./blogArticles";

export const blogArticlesEnUS: BlogArticle[] = [
  {
    slug: 'o-que-e-rdo',
    path: '/blog/o-que-e-rdo',
    title: 'What Is a DCR? Understanding the Daily Construction Report',
    seoTitle: 'What Is a DCR? Daily Construction Report | Meta Construtor',
    description:
      'Learn what DCR means in construction, what it is used for, and which fields to fill in the daily work report.',
    category: 'Digital DCR',
    intent: 'Informational search for those discovering the acronym DCR',
    readingTime: '5 min',
    summary:
      'DCR stands for Daily Construction Report — the most common acronym for a daily work report. It records what happened on the construction site on a specific day, including activities, crew, weather, photos, pending issues, and incidents.',
    publishedAt: '2026-06-06',
    updatedAt: '2026-06-06',
    keywords: ['what is a dcr', 'dcr', 'daily construction report', 'daily work report', 'digital dcr'],
    takeaways: [
      'DCR, in construction routines, stands for Daily Construction Report.',
      'The record helps document activities, crew, weather, incidents, and evidence.',
      'A well-made DCR reduces information loss between the field, engineering, and management.',
    ],
    sections: [
      {
        title: 'Short Answer',
        body:
          'A DCR is a daily report that documents the routine of a construction site. It shows what was done, who worked, which resources were used, what problems came up, and what evidence proves the work progress. In practice, the DCR functions as the written memory of the construction site: anyone who picks up the report for a specific day should be able to understand what happened on site without having to ask someone who was there. This role as a faithful record is what sets an organized project apart from one that relies on hallway conversations to piece together the history. Companies that adopt the DCR with discipline notice a significant reduction in communication noise between the field, engineering, and administration, because the information no longer lives in one person\'s head — it becomes documented, accessible, and consultable by any team member at any time.',
        image: {
          src: 'https://images.unsplash.com/photo-1541888946425-d81bb724c364?w=1200&q=80',
          alt: 'Ongoing construction with concrete structure',
          caption: 'A daily construction report documents every stage of the build',
          credit: 'Unsplash',
        },
      },
      {
        title: 'What Is a DCR Used For',
        body:
          'The DCR creates operational memory. Without this record, the company relies on scattered messages, photos without context, and individual recollections. With the DCR, managers can review deadlines, justify delays, track productivity, and consult the project history with greater confidence. Additionally, the DCR serves as supporting documentation in planning meetings and resource allocation decisions. When a project faces an unforeseen event — such as material shortages or adverse weather — the DCR logged on that day provides the precise justification for the schedule deviation. Without this record, the justification is weak and depends on the memory of whoever was present. The DCR also serves as input for measuring completed work, giving the company\'s finance department concrete data to support billing with the client or oversight body. For construction companies juggling multiple simultaneous projects, a well-filled DCR becomes the primary operational traceability tool.',
      },
      {
        title: 'What Should Go Into the Report',
        body:
          'The structure varies by company, but some fields form a reliable foundation for almost any project. Ideally, the DCR template should be defined before the project starts, with fields that meet both field requirements and management demands. A well-designed DCR prevents rework during filling and ensures no critical information is forgotten.',
        items: [
          'Project name, date, shift, person responsible for the record, and technical responsible party.',
          'Weather conditions, crew present, equipment, and relevant materials.',
          'Activities performed, stalled services, interferences, and incidents.',
          'Photos, attachments, pending items, approvals, and technical notes.',
        ],
      },
      {
        title: 'Who Should Fill It Out',
        body:
          'Typically, filling is done by someone close to the execution: foreman, site supervisor, technician, engineer, or another responsible party defined by the company. The key point is to have a daily routine and clear review criteria. It is no use having the best DCR template if filling is delegated to someone who has no visibility of what happened on that day. Ideally, the same person who followed the execution should register the report at the end of the shift, before leaving the site. On larger projects, there may be more than one person responsible for filling — one for each work front — and an engineer who consolidates and reviews the records. The important thing is that the review flow is fast: if the DCR needs approval, the approver should have access on the same day or at most the next day, so that any corrections can be made while the field team\'s memory is still fresh.',
      },
      {
        title: 'Digital DCR vs. Spreadsheet',
        body:
          'Spreadsheets may work at the start, but lose strength as the project grows. A digital DCR makes it easy to attach photos, maintain a history per project, standardize fields, search old records, and share information without relying on scattered files. Spreadsheets require someone to organize folders, name files correctly, and ensure versioning is under control. With a digital DCR, the record is entered once and is available to everyone — field, engineering, management, and client — with access controlled by role. Another important advantage is the ability to automatically generate consolidated reports, cross-referencing crew data, productivity, and incidents over time. For companies looking to scale their operations, the digital DCR stops being a cost and becomes an investment in organization and agility in decision-making.',
      },
    ],
    faq: [
      {
        question: 'What is a DCR?',
        answer:
          'DCR stands for Daily Construction Report, used to daily record activities, crew, weather, materials, incidents, photos, and pending items on a construction site.',
      },
      {
        question: 'Is a DCR mandatory?',
        answer:
          'Mandatory status depends on the contract, project type, and technical or management requirements. Even when not formally required, a DCR is a good practice for traceability.',
      },
      {
        question: 'What is the difference between DCR and a construction diary?',
        answer:
          'In practice, the terms are often used for similar records. DCR highlights the daily report; a construction diary can be used more broadly for the continuous project history.',
      },
    ],
    cta: {
      title: 'Want to standardize your project\'s DCR?',
      description:
        'Meta Construtor organizes DCRs, photos, pending items, activities, and documents into a single routine per project.',
      label: 'See plans',
      href: '/preco',
    },
  },
];
