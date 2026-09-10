import React from 'react'
export default function MetricCard({label,value,hint,tone=''}){return <div className={`metric ${tone}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{hint&&<div className="metric-hint">{hint}</div>}</div>}
