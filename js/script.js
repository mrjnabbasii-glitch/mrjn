
const STORAGE_KEY = "buildingIssueTracker.requests.v1";

const seedRequests = [
  {id:1,title:"قطع برق در سالن عملیات",requester:"مریم عباسی",location:"ساختمان اداری، طبقه ۲",category:"برق",priority:"فوری",date:"1403/11/02",description:"برق بخشی از سالن عملیات قطع شده و چند تجهیز از کار افتاده است.",status:"new"},
  {id:2,title:"خرابی آسانسور",requester:"علی رضایی",location:"ساختمان اداری، ورودی اصلی",category:"آسانسور",priority:"خیلی فوری",date:"1403/11/03",description:"آسانسور متوقف شده و در طبقه دوم درها باز نمی‌شوند.",status:"review"},
  {id:3,title:"مشکل سیستم سرمایش",requester:"سارا احمدی",location:"اتاق جلسات، طبقه ۳",category:"سرمایش",priority:"عادی",date:"1403/11/04",description:"سیستم سرمایش اتاق جلسات عملکرد مطلوبی ندارد.",status:"repair"},
  {id:4,title:"نشتی شدید آب",requester:"حسین کریمی",location:"پارکینگ، طبقه منفی ۱",category:"آب",priority:"خیلی فوری",date:"1403/11/05",description:"نشتی شدید آب از لوله اصلی مشاهده شده و کف پارکینگ خیس شده است.",status:"new"},
  {id:5,title:"خرابی تجهیزات شبکه",requester:"نگار موسوی",location:"اتاق سرور",category:"تجهیزات",priority:"عادی",date:"1403/11/06",description:"یکی از تجهیزات شبکه ارتباط چند سیستم را قطع کرده است.",status:"done"}
];

const statusInfo = {
  new:{label:"جدید",next:"review"},
  review:{label:"در حال بررسی",next:"repair"},
  repair:{label:"در حال تعمیر",next:"done"},
  done:{label:"انجام شده",next:null}
};
const priorityRank = {"عادی":1,"فوری":2,"خیلی فوری":3};

function getRequests(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(!saved){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRequests)); return [...seedRequests]; }
  try{return JSON.parse(saved)}catch{return [...seedRequests]}
}
function saveRequests(list){localStorage.setItem(STORAGE_KEY, JSON.stringify(list))}
function nextId(list){return list.length ? Math.max(...list.map(r=>Number(r.id)||0))+1 : 1}
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function priorityClass(p){
  if(p==="خیلی فوری") return "critical";
  if(p==="فوری") return "urgent";
  return "normal";
}
function statusBadge(status){const i=statusInfo[status]||statusInfo.new; return `<span class="badge ${status}">${i.label}</span>`}
function autoPriority(category, description, chosen){
  const text = `${category} ${description}`.toLowerCase();
  if(category==="آسانسور" || text.includes("نشتی شدید") || text.includes("آب‌گرفتگی") || text.includes("آب گرفتگی")) return "خیلی فوری";
  return chosen || "عادی";
}
function renderRequestCard(r){
  const urgent = priorityClass(r.priority)==="critical" ? " critical" : (priorityClass(r.priority)==="urgent" ? " urgent" : "");
  const next = statusInfo[r.status]?.next;
  const nextLabel = next ? statusInfo[next].label : "";
  return `<article class="request-card${urgent}">
    <div class="request-top">
      <div class="request-title"><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.requester)} — ${escapeHtml(r.location)}</p></div>
      ${statusBadge(r.status)}
    </div>
    <div class="card-meta">
      <div class="kv"><span>اولویت</span><strong><span class="badge ${priorityClass(r.priority)}">${escapeHtml(r.priority)}</span></strong></div>
      <div class="kv"><span>دسته</span><strong>${escapeHtml(r.category)}</strong></div>
      <div class="kv"><span>محل</span><strong>${escapeHtml(r.location)}</strong></div>
      <div class="kv"><span>تاریخ</span><strong>${escapeHtml(r.date)}</strong></div>
    </div>
    <div class="card-actions">
      <a class="btn secondary" href="details.html?id=${encodeURIComponent(r.id)}">مشاهده جزئیات</a>
      ${next ? `<button class="btn" data-action="status" data-id="${r.id}">تغییر به «${nextLabel}»</button>` : ""}
      <button class="btn danger" data-action="delete" data-id="${r.id}">حذف درخواست</button>
    </div>
  </article>`;
}
function bindDeleteButtons(container){
  container.querySelectorAll("[data-action=\'delete\']").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=Number(btn.dataset.id);
      const item=getRequests().find(r=>Number(r.id)===id);
      if(!item) return;
      if(!confirm(`آیا درخواست «${item.title}» حذف شود؟`)) return;
      const list=getRequests().filter(r=>Number(r.id)!==id);
      saveRequests(list);
      renderRequestsPage(); renderDashboard(); renderDetailsPage();
    });
  });
}
function bindStatusButtons(container){
  container.querySelectorAll("[data-action='status']").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const list=getRequests(), id=Number(btn.dataset.id), item=list.find(r=>Number(r.id)===id);
      if(!item || !statusInfo[item.status].next) return;
      item.status=statusInfo[item.status].next; saveRequests(list);
      renderRequestsPage(); renderDashboard(); renderDetailsPage();
    });
  });
}
function renderRequestsPage(){
  const host=document.getElementById("requestList"); if(!host)return;
  const search=(document.getElementById("searchInput")?.value||"").trim().toLowerCase();
  const category=document.getElementById("categoryFilter")?.value||"all";
  const status=document.getElementById("statusFilter")?.value||"all";
  const priority=document.getElementById("priorityFilter")?.value||"all";
  let list=getRequests().filter(r=>{
    const hay=`${r.title} ${r.requester} ${r.location} ${r.category} ${r.description}`.toLowerCase();
    return (!search||hay.includes(search)) && (category==="all"||r.category===category) && (status==="all"||r.status===status) && (priority==="all"||r.priority===priority);
  });
  host.innerHTML=list.length?list.map(renderRequestCard).join(""):`<div class="empty">درخواستی با این فیلترها پیدا نشد.</div>`;
  bindStatusButtons(host); bindDeleteButtons(host);
}
function renderDashboard(){
  const list=getRequests();
  const total=document.getElementById("countTotal"), n=document.getElementById("countNew"), v=document.getElementById("countReview"), p=document.getElementById("countRepair");
  if(total) total.textContent=list.length;
  if(n) n.textContent=list.filter(r=>r.status==="new").length;
  if(v) v.textContent=list.filter(r=>r.status==="review").length;
  if(p) p.textContent=list.filter(r=>r.status==="repair").length;
  const d=document.getElementById("countDone"); if(d)d.textContent=list.filter(r=>r.status==="done").length; const hc=document.getElementById("highCount"); if(hc)hc.textContent=list.filter(r=>r.priority!=="عادی").length;
  const recent=document.getElementById("recentList");
  if(recent){recent.innerHTML=list.slice().sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,3).map(renderRequestCard).join("");bindStatusButtons(recent);bindDeleteButtons(recent)}
}
function renderDetailsPage(){
  const box=document.getElementById("detailsHost"); if(!box)return;
  const id=new URLSearchParams(location.search).get("id");
  const item=getRequests().find(r=>String(r.id)===String(id)) || getRequests()[0];
  if(!item){box.innerHTML='<div class="empty">درخواستی وجود ندارد.</div>';return}
  const states=["new","review","repair","done"], current=states.indexOf(item.status);
  box.innerHTML=`<div class="detail-grid">
    <section class="detail-block">
      <h2>اطلاعات درخواست</h2>
      <div class="detail-rows" style="margin-top:14px">
        <div class="rowline"><span>عنوان</span><strong>${escapeHtml(item.title)}</strong></div>
        <div class="rowline"><span>وضعیت</span><strong>${statusBadge(item.status)}</strong></div>
        <div class="rowline"><span>اولویت</span><strong>${escapeHtml(item.priority)}</strong></div>
        <div class="rowline"><span>دسته</span><strong>${escapeHtml(item.category)}</strong></div>
        <div class="rowline"><span>محل</span><strong>${escapeHtml(item.location)}</strong></div>
        <div class="rowline"><span>ثبت‌کننده</span><strong>${escapeHtml(item.requester)}</strong></div>
        <div class="rowline"><span>تاریخ</span><strong>${escapeHtml(item.date)}</strong></div>
        <div class="rowline"><span>شرح</span><strong>${escapeHtml(item.description)}</strong></div>
      </div>
      ${statusInfo[item.status].next?`<div class="actions"><button class="btn" id="detailStatusBtn">تغییر به «${statusInfo[statusInfo[item.status].next].label}»</button><button class="btn danger" id="detailDeleteBtn">حذف درخواست</button></div>`:`<div class="actions"><button class="btn danger" id="detailDeleteBtn">حذف درخواست</button></div>`}
    </section>
    <section class="detail-block">
      <h2>روند رسیدگی</h2>
      <div class="timeline" style="margin-top:16px">
        ${states.map((s,i)=>`<div class="timeline-item ${i<current?"done":""} ${i===current?"current":""}">
          <span class="dot"></span><div><strong>${statusInfo[s].label}</strong><div style="color:var(--muted);font-size:.82rem">${i<=current?"این مرحله ثبت شده است.":"پس از تکمیل مرحله قبل فعال می‌شود."}</div></div>
        </div>`).join("")}
      </div>
    </section>
  </div>`;
  document.getElementById("detailDeleteBtn")?.addEventListener("click",()=>{
    if(!confirm(`آیا درخواست «${item.title}» حذف شود؟`)) return;
    const list=getRequests().filter(r=>Number(r.id)!==Number(item.id));
    saveRequests(list);
    location.href="requests.html";
  });
  document.getElementById("detailStatusBtn")?.addEventListener("click",()=>{
    const list=getRequests(), x=list.find(r=>Number(r.id)===Number(item.id));
    x.status=statusInfo[x.status].next;saveRequests(list);renderDetailsPage();renderDashboard();
  });
}
function setupRegister(){
  const form=document.getElementById("requestForm"); if(!form)return;
  const date=document.getElementById("date"); if(date&&!date.value) date.value=new Date().toISOString().slice(0,10);
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const data=new FormData(form);
    const requester=data.get("requester")?.trim(), location=data.get("location")?.trim(), category=data.get("category"), description=data.get("description")?.trim(), chosen=data.get("priority");
    const error=document.getElementById("formMessage");
    if(!requester||!location||!category||!description){error.className="notice error";error.textContent="لطفاً همه فیلدهای ضروری را تکمیل کنید.";return}
    const list=getRequests();
    const priority=autoPriority(category,description,chosen);
    const item={id:nextId(list),title:`${category} در ${location}`,requester,location,category,priority,date:data.get("date")||"ثبت نشده",description,status:"new"};
    list.unshift(item);saveRequests(list);
    if(error){error.className="notice";error.textContent=`درخواست با موفقیت ثبت شد. اولویت تعیین‌شده: ${priority}`;}
    form.reset(); if(date)date.value=new Date().toISOString().slice(0,10);
  });
}
function setupFilters(){
  const params=new URLSearchParams(location.search);
  const statusParam=params.get("status");
  const priorityParam=params.get("priority");
  const statusEl=document.getElementById("statusFilter");
  const priorityEl=document.getElementById("priorityFilter");
  if(statusEl && statusParam && [...statusEl.options].some(o=>o.value===statusParam)) statusEl.value=statusParam;
  if(priorityEl && priorityParam && [...priorityEl.options].some(o=>o.value===priorityParam)) priorityEl.value=priorityParam;
  ["searchInput","categoryFilter","statusFilter","priorityFilter"].forEach(id=>document.getElementById(id)?.addEventListener("input",renderRequestsPage));
}
document.addEventListener("DOMContentLoaded",()=>{
  setupRegister();setupFilters();renderRequestsPage();renderDashboard();renderDetailsPage();
});
window.addEventListener("storage",()=>{renderRequestsPage();renderDashboard();renderDetailsPage()});
