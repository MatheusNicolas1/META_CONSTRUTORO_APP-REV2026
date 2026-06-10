#!/usr/bin/env python3
"""
Pipeline contínuo de artigos do blog — suporta renovação automática de temas.
Cada execução verifica qual é o próximo artigo pendente.
Quando os temas iniciais acabam, retorna sinal para buscar novas tendências.

Uso:
  python blog-pipeline-2026-06.py status        — mostra fila completa
  python blog-pipeline-2026-06.py progress      — "3/180"
  python blog-pipeline-2026-06.py next          — JSON com próximo slug/tema pendente
  python blog-pipeline-2026-06.py mark-started  — marca slug como em andamento
  python blog-pipeline-2026-06.py mark-complete — marca slug como concluído
  python blog-pipeline-2026-06.py drain         — quando fila acabar: retorna RENEW
  python blog-pipeline-2026-06.py add-temas     — adiciona novos temas à fila
  python blog-pipeline-2026-06.py reset         — limpa estado
"""

import json, os, sys, random

STATE_FILE = os.path.expanduser("~/AppData/Local/hermes/scripts/blog-pipeline-2026-06-state.json")

# Temas iniciais (8 artigos)
TEMAS_INICIAIS = [
    ("diario-de-obra-app-online", "Diário de obra online: como fazer digital gratuito em 2026"),
    ("orcamento-de-obra-passo-a-passo", "Orçamento de obra: guia completo com exemplos práticos"),
    ("planejamento-de-obra-passo-a-passo", "Planejamento de obra: passo a passo do início ao fim"),
    ("app-gestao-de-obras-gratuito", "App de gestão de obras gratuito: melhores opções 2026"),
    ("custo-de-obra-por-m2-2026", "Custo de obra por m² em 2026: tabela completa atualizada"),
    ("checklist-de-obra-modelo-pdf", "Checklist de obra: modelo PDF gratuito para imprimir"),
    ("seguranca-do-trabalho-canteiro-de-obras", "Segurança do trabalho em canteiro de obras: guia NR-18"),
    ("construcao-civil-tendencias-2026", "Construção civil 2026: tendências, mercado e oportunidades"),
]

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"completos": [], "atual": None, "fila": [t for t in TEMAS_INICIAIS]}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def cmd_status():
    state = load_state()
    fila = state.get("fila", TEMAS_INICIAIS)
    completos = set(state["completos"])
    print(f"📊 FILA: {len(fila)} artigos | Completos: {len(completos)}\n")
    for slug, titulo in fila:
        if slug in completos:
            status = "✅"
        elif state["atual"] == slug:
            status = "▶️"
        else:
            status = "⬜"
        print(f"{status}  {slug} — {titulo}")

def cmd_progress():
    state = load_state()
    fila = state.get("fila", TEMAS_INICIAIS)
    done = len(state["completos"])
    total = len(fila)
    print(f"{done}/{total}")

def cmd_next():
    state = load_state()
    fila = state.get("fila", TEMAS_INICIAIS)
    completos = set(state["completos"])
    
    # Verifica se fila acabou
    if len(completos) >= len(fila):
        print(json.dumps({"action": "RENEW", "message": "Fila esgotada! Buscar novas tendências com pesquisa web."}))
        return
    
    # Pega próximo não completo e não atual
    for slug, titulo in fila:
        if slug not in completos and state.get("atual") != slug:
            print(json.dumps({"slug": slug, "titulo": titulo, "index": fila.index((slug, titulo)) + 1}))
            return
    
    # Se chegou aqui, o atual ainda está em andamento
    print(json.dumps({"action": "WAIT", "message": f"Artigo {state['atual']} em andamento"}))

def cmd_mark_started():
    slug = sys.argv[2] if len(sys.argv) > 2 else None
    if not slug:
        print("❌  Forneça o slug")
        sys.exit(1)
    state = load_state()
    state["atual"] = slug
    save_state(state)
    print(f"▶️  {slug} iniciado")

def cmd_mark_complete():
    slug = sys.argv[2] if len(sys.argv) > 2 else None
    if not slug:
        print("❌  Forneça o slug")
        sys.exit(1)
    state = load_state()
    if slug not in state["completos"]:
        state["completos"].append(slug)
    state["atual"] = None
    save_state(state)
    print(f"✅  {slug} completo")

def cmd_drain():
    """Verifica se fila acabou — usado pelo cron job para decidir se busca novos temas"""
    state = load_state()
    fila = state.get("fila", TEMAS_INICIAIS)
    completos = set(state["completos"])
    
    total = len(fila)
    done = len(completos)
    restante = total - done
    
    if restante <= 0:
        print(json.dumps({"status": "RENEW", "done": done, "total": total, "message": "Fila esgotada!"}))
    else:
        # Próximo slug pendente
        for slug, titulo in fila:
            if slug not in completos and state.get("atual") != slug:
                print(json.dumps({"status": "PENDING", "done": done, "total": total, "restante": restante, "next": slug}))
                return
        print(json.dumps({"status": "RUNNING", "done": done, "total": total, "restante": restante, "current": state.get("atual")}))

def cmd_add_temas():
    """Adiciona novos temas à fila (recebe JSON do pipe)"""
    import sys
    novos = json.loads(sys.stdin.read())
    state = load_state()
    fila = list(state.get("fila", TEMAS_INICIAIS))
    
    for slug, titulo in novos:
        # Evita duplicatas
        if slug not in [s for s, _ in fila]:
            fila.append((slug, titulo))
    
    state["fila"] = fila
    save_state(state)
    total = len(fila)
    completos = len(state["completos"])
    print(f"✅ {len(novos)} temas adicionados | Total: {total} | Completos: {completos}")

def cmd_renovar():
    """Zera completos e mantém a fila — usado para reboot do pipeline"""
    state = load_state()
    state["completos"] = []
    state["atual"] = None
    save_state(state)
    fila = state.get("fila", TEMAS_INICIAIS)
    print(f"🔄  Estado renovado | {len(fila)} temas na fila")

def cmd_reset():
    save_state({"completos": [], "atual": None, "fila": [t for t in TEMAS_INICIAIS]})
    print("🔄  Estado resetado para temas iniciais")

if __name__ == "__main__":
    cmds = {
        "status": cmd_status,
        "progress": cmd_progress,
        "next": cmd_next,
        "mark-started": cmd_mark_started,
        "mark-complete": cmd_mark_complete,
        "drain": cmd_drain,
        "add-temas": cmd_add_temas,
        "renovar": cmd_renovar,
        "reset": cmd_reset,
    }
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    fn = cmds.get(action)
    if fn:
        fn()
    else:
        print(f"Comandos: {', '.join(cmds.keys())}")
        sys.exit(1)
