export const uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-5)}`
export const todayStr = () => { const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` }
export const nowIso = () => new Date().toISOString()
export const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
export const dateBR = date => date ? new Date(`${date.slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR') : '—'
export const dateTimeBR = iso => iso ? new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '—'
export const addDays = (date,n) => { const d=new Date(`${date||todayStr()}T12:00:00`); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10) }
export const daysSince = date => { if(!date) return 999; const a=new Date(`${todayStr()}T12:00:00`), b=new Date(`${date.slice(0,10)}T12:00:00`); return Math.max(0,Math.floor((a-b)/86400000)) }
export const normPhone = value => String(value||'').replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'')
export const normDoc = value => String(value||'').replace(/\D/g,'')
export const normEmail = value => String(value||'').trim().toLowerCase()
export const clamp = (n,min,max) => Math.max(min,Math.min(max,n))
export const periodMatches = (date,period) => {
  if(period==='all') return true
  if(!date) return false
  const day=date.slice(0,10), diff=daysSince(day)
  if(period==='today') return day===todayStr()
  if(period==='7') return diff>=0 && diff<=7
  if(period==='30') return diff>=0 && diff<=30
  if(period==='month') return day.slice(0,7)===todayStr().slice(0,7)
  return true
}
