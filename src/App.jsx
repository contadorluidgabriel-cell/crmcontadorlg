import React, { useState } from 'react'
import { CrmProvider } from './context/CrmContext.jsx'
import Shell from './components/Shell.jsx'
import NewOpportunityModal from './components/NewOpportunityModal.jsx'
import ActivityModal from './components/ActivityModal.jsx'
import OpportunityDrawer from './components/OpportunityDrawer.jsx'
import Central from './pages/Central.jsx'
import Pipeline from './pages/Pipeline.jsx'
import Leads from './pages/Leads.jsx'
import Activities from './pages/Activities.jsx'
import Reactivation from './pages/Reactivation.jsx'
import Proposals from './pages/Proposals.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

function CrmApp(){
  const [view,setView]=useState('central')
  const [newLead,setNewLead]=useState({open:false,contact:null})
  const [drawer,setDrawer]=useState(null)
  const [activity,setActivity]=useState(null)
  const openOpportunity=(id,tab='summary')=>setDrawer({id,tab})
  const openActivity=(opportunityId='',item=null)=>setActivity({opportunityId,item})
  const newForContact=contact=>setNewLead({open:true,contact})
  const pages={
    central:<Central openOpportunity={openOpportunity} openActivity={openActivity}/>,
    pipeline:<Pipeline openOpportunity={openOpportunity}/>,
    leads:<Leads openOpportunity={openOpportunity} newForContact={newForContact}/>,
    atividades:<Activities openOpportunity={openOpportunity} openActivity={openActivity}/>,
    reativacao:<Reactivation openOpportunity={openOpportunity}/>,
    propostas:<Proposals openOpportunity={openOpportunity}/>,
    relatorios:<Reports/>,
    configuracoes:<Settings/>,
  }
  return <Shell view={view} setView={setView} onNew={()=>setNewLead({open:true,contact:null})} openOpportunity={openOpportunity}>
    {pages[view]}
    <NewOpportunityModal open={newLead.open} initialContact={newLead.contact} onClose={()=>setNewLead({open:false,contact:null})} onCreated={openOpportunity}/>
    <ActivityModal open={!!activity} opportunityId={activity?.opportunityId} activity={activity?.item} onClose={()=>setActivity(null)}/>
    {drawer&&<OpportunityDrawer id={drawer.id} initialTab={drawer.tab} onClose={()=>setDrawer(null)} openActivity={openActivity}/>} 
  </Shell>
}

export default function App(){return <CrmProvider><CrmApp/></CrmProvider>}
