import React from 'react'
export default function FilterChips({label,value,onChange,items}){return <div className="filter-group"><span className="filter-label">{label}</span>{items.map(([v,text])=><button key={v} className="filter-chip" aria-pressed={value===v} onClick={()=>onChange(v)}>{text}</button>)}</div>}
