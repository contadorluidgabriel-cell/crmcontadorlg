import React from 'react'
import { Activity, BarChart3, ChevronLeft, FileText, LayoutDashboard, Menu, MoreHorizontal, Plus, RefreshCcw, Search, Settings, Target, Users, X } from 'lucide-react'
import { useCrm } from '../context/CrmContext.jsx'
import { getCompany, getContact, serviceNames } from '../lib/domain.js'

const nav=[
  ['central','Central Comercial',LayoutDashboard],['pipeline','Pipeline',Target],['leads','Leads',Users],['atividades','Atividades',Activity],['reativacao','Reativação',RefreshCcw],['propostas','Propostas',FileText],['relatorios','Relatórios',BarChart3],['configuracoes','Configurações',Settings],
]
const titles={
  central:['Central Comercial','Prioridades, oportunidades e metas do período'],pipeline:['Pipeline de Vendas','Oportunidades organizadas por etapa'],leads:['Leads','Contatos e oportunidades comerciais'],atividades:['Atividades e Follow-ups','O que precisa ser feito e quando'],reativacao:['Reativação','Oportunidades antigas com potencial de retorno'],propostas:['Propostas','Versões, validade, implantação e mensalidade'],relatorios:['Relatórios Comerciais','Funil, coorte, receita, MRR e origem'],configuracoes:['Configurações','Metas, serviços, mensagens e dados'],
}

export default function Shell({view,setView,onNew,openOpportunity,children}){
  const {state,uiPeriod,setUiPeriod}=useCrm()
  const [collapsed,setCollapsed]=React.useState(()=>localStorage.getItem('crm_sidebar_collapsed')==='1')
  const [mobile,setMobile]=React.useState(false)
  const [search,setSearch]=React.useState('')
  const [title,sub]=titles[view]
  const choose=v=>{setView(v);setMobile(false)}
  const toggle=()=>setCollapsed(v=>{localStorage.setItem('crm_sidebar_collapsed',!v?'1':'0');return !v})
  const q=search.trim().toLowerCase()
  const results=q?state.opportunities.filter(o=>{const c=getContact(state,o),co=getCompany(state,o);return `${c?.name||''} ${c?.phone||''} ${c?.email||''} ${co?.name||''} ${co?.doc||''} ${serviceNames(o)} ${o.stage}`.toLowerCase().includes(q)}).slice(0,8):[]
  const openResult=id=>{openOpportunity(id);setSearch('')}

  return <div className={`app-shell ${collapsed?'collapsed':''}`}>
    <aside className={`sidebar ${mobile?'show':''}`}><div className="brand-row"><div className="brand-mark">LG</div><div className="brand-copy"><strong>Luid Gabriel</strong><span>CRM Comercial V2.3.1</span></div><button className="icon-button sidebar-toggle" onClick={toggle} aria-label="Recolher ou expandir menu"><ChevronLeft/></button></div><nav className="sidebar-nav" aria-label="Navegação principal">{nav.map(([id,label,Icon])=><button key={id} className={view===id?'active':''} onClick={()=>choose(id)}><Icon/><span>{label}</span></button>)}</nav><div className="sidebar-note"><b>CRM = comercial</b><br/>Depois do fechamento, a operação segue para o Meu Escritório Digital.</div></aside>
    <main className="main-area"><header className="topbar"><div className="topbar-title"><button className="icon-button mobile-menu" onClick={()=>setMobile(true)} aria-label="Abrir menu"><Menu/></button><div><h1>{title}</h1><p>{sub}</p></div></div><div className="topbar-tools"><div className="global-search"><Search/><input aria-label="Busca global" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente, CNPJ, WhatsApp..."/>{search&&<button className="search-clear" onClick={()=>setSearch('')} aria-label="Limpar busca"><X/></button>}{q&&<div className="search-results" role="listbox">{results.map(o=>{const c=getContact(state,o),co=getCompany(state,o);return <button key={o.id} onClick={()=>openResult(o.id)}><span><b>{c?.name}</b><small>{co?.name||'Sem empresa'} · {serviceNames(o)}</small></span><span className="pill neutral">{o.stage}</span></button>})}{!results.length&&<div className="empty-search">Nenhum resultado.</div>}</div>}</div><select className="period-select" value={uiPeriod} onChange={e=>setUiPeriod(e.target.value)} aria-label="Período global"><option value="today">Hoje</option><option value="7">7 dias</option><option value="30">30 dias</option><option value="month">Este mês</option><option value="all">Todo período</option></select><div className="top-actions"><button className="btn" onClick={()=>choose('atividades')}>Follow-ups</button><button className="btn primary" onClick={onNew}><Plus/>Novo lead</button></div></div></header>
      <section className="content">{state.recovery?.blocked&&<div className="notice warning spaced"><b>Proteção de dados ativada</b><br/>O CRM encontrou um formato de dados que não reconhece e bloqueou a gravação automática. Os dados originais permanecem preservados no navegador. Vá em Configurações para exportar o estado bruto antes de qualquer ação.</div>}{children}</section>
    </main>
    <nav className="mobile-bottom-nav">{nav.slice(0,4).map(([id,label,Icon])=><button key={id} className={view===id?'active':''} onClick={()=>choose(id)}><Icon/><span>{id==='central'?'Início':label}</span></button>)}<button onClick={()=>setMobile(true)}><MoreHorizontal/><span>Mais</span></button></nav>{mobile&&<button className="mobile-overlay" onClick={()=>setMobile(false)} aria-label="Fechar menu"/>}
  </div>
}
