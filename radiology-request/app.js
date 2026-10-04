(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const urgentReasons = ['Unwell on respiratory support','Needs intubation','Sudden deterioration','Pneumothorax','To check chest drain','To check Umbilical lines','To check PICC Line','Others'];
  let modality = 'X-ray', priority = 'Routine', priorXrays = '';
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pktParts = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const pktDisplay = () => new Intl.DateTimeFormat('en-PK',{timeZone:'Asia/Karachi',dateStyle:'medium',timeStyle:'short'}).format(new Date());
  const val = id => $(id).value.trim();
  const toggle = (id, show) => $(id).hidden = !show;
  const setToast = text => { $('toast').textContent = text; setTimeout(() => $('toast').textContent = '', 4500); };

  for (let i=4;i<=60;i++) $('weight').add(new Option(`${(i/10).toFixed(1)} kg`,`${(i/10).toFixed(1)} kg`));
  for (let i=1;i<=10;i++) $('xrayCount').add(new Option(`${i} prior X-ray${i===1?'':'s'}`,String(i)));
  $('xrayCount').add(new Option('10+ prior X-rays','10+'));
  urgentReasons.forEach(x => $('urgentReason').add(new Option(x,x)));
  ['Axial','Coronal','Sagittal','Others'].forEach((x,i) => $('ctViews').insertAdjacentHTML('beforeend',`<label><input type="checkbox" name="ctView" value="${x}" ${i===0?'checked':''}> ${x}</label>`));
  $('admissionDate').value = pktParts();
  $('clock').textContent = pktDisplay();
  setInterval(() => $('clock').textContent = pktDisplay(), 60000);

  $('admissionStatus').addEventListener('change', () => toggle('readmissionWrap', val('admissionStatus') === 'Readmitted'));
  $('readmissionCount').addEventListener('change', () => toggle('readmissionOtherWrap', val('readmissionCount') === 'Others'));
  $('pregType').addEventListener('change', () => {
    const type=val('pregType'); toggle('specificBabyWrap',type!=='Singleton'); $('specificBaby').innerHTML='';
    (type==='Twins'?['1st Twin','2nd Twin']:type==='Triplets'?['1st Triplet','2nd Triplet','3rd Triplet']:[]).forEach(x=>$('specificBaby').add(new Option(x,x)));
  });
  $('urgentReason').addEventListener('change', () => toggle('urgentOtherWrap',val('urgentReason')==='Others'));
  $('xrayType').addEventListener('change', () => toggle('xrayTypeOtherWrap',val('xrayType')==='Others'));
  $('xrayView').addEventListener('change', () => toggle('xrayViewOtherWrap',val('xrayView')==='Others'));
  $('ctType').addEventListener('change', () => { toggle('ctSubtypeWrap',val('ctType')==='Chest'); toggle('ctTypeOtherWrap',val('ctType')==='Others'); });
  $('mriType').addEventListener('change', () => toggle('mriTypeOtherWrap',val('mriType')==='Others'));
  $('usType').addEventListener('change', () => toggle('usTypeOtherWrap',val('usType')==='Others'));
  $('ctViews').addEventListener('change', () => toggle('ctViewsOtherWrap',[...document.querySelectorAll('[name=ctView]:checked')].some(x=>x.value==='Others')));

  document.querySelectorAll('[data-priority]').forEach(btn => btn.addEventListener('click', () => {
    priority=btn.dataset.priority; document.querySelectorAll('[data-priority]').forEach(x=>x.classList.toggle('active',x===btn));
    $('priorityBox').classList.toggle('urgent',priority==='Urgent'); toggle('urgentReasonWrap',priority==='Urgent'); toggle('urgentOtherWrap',priority==='Urgent'&&val('urgentReason')==='Others');
  }));
  document.querySelectorAll('[data-modality]').forEach(btn => btn.addEventListener('click', () => {
    modality=btn.dataset.modality; document.querySelectorAll('[data-modality]').forEach(x=>x.classList.toggle('active',x===btn));
    [['xrayFields','X-ray'],['ctFields','CT scan'],['mriFields','MRI'],['usFields','Ultrasound']].forEach(([id,name])=>toggle(id,modality===name));
  }));
  document.querySelectorAll('[data-prior]').forEach(btn => btn.addEventListener('click', () => {
    priorXrays=btn.dataset.prior; document.querySelectorAll('[data-prior]').forEach(x=>x.classList.toggle('active',x===btn)); toggle('priorDetails',priorXrays==='yes');
  }));

  function validate() {
    document.querySelectorAll('.invalid').forEach(x=>x.classList.remove('invalid'));
    const errors=[]; const require=(id,msg)=>{if(!val(id)){errors.push(msg);$(id).classList.add('invalid');}};
    require('motherName',"Mother's name is required"); require('fatherName',"Father's name is required"); require('mrNumber','MR number is required'); require('weight','Weight is required'); require('admissionDate','Admission date is required'); require('docName','Requesting clinician name is required'); require('clinicalNotes','Clinical indication is required');
    if(val('admissionStatus')==='Readmitted'&&val('readmissionCount')==='Others') require('readmissionOther','Specify readmission number');
    if(val('pregType')!=='Singleton') require('specificBaby','Identify the baby');
    if(priority==='Urgent'&&val('urgentReason')==='Others') require('urgentReasonOther','Specify the urgent indication');
    if(modality==='X-ray') { if(val('xrayType')==='Others') require('xrayTypeOther','Specify X-ray type'); if(val('xrayView')==='Others') require('xrayViewOther','Specify X-ray view'); if(!priorXrays) errors.push('Confirm whether prior X-rays were performed'); if(priorXrays==='yes'&&!$('previousXrayConfirmed').checked) errors.push('Confirm the bedside chart/PACS radiation check'); }
    if(modality==='CT scan') { if(val('ctType')==='Others') require('ctTypeOther','Specify CT target'); const views=[...document.querySelectorAll('[name=ctView]:checked')]; if(!views.length) errors.push('Select at least one CT view'); if(views.some(x=>x.value==='Others')) require('ctViewsOther','Specify other CT view'); }
    if(modality==='MRI'&&val('mriType')==='Others') require('mriTypeOther','Specify MRI target');
    if(modality==='Ultrasound'&&val('usType')==='Others') require('usTypeOther','Specify ultrasound target');
    $('errorBanner').hidden=!errors.length; $('errorBanner').innerHTML=errors.length?`Please correct:<ul>${errors.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'';
    if(errors.length) $('errorBanner').scrollIntoView({behavior:'smooth',block:'center'}); return !errors.length;
  }

  function details() {
    if(modality==='X-ray') return {study:`X-ray — ${val('xrayType')==='Others'?val('xrayTypeOther'):val('xrayType')}`,view:val('xrayView')==='Others'?val('xrayViewOther'):val('xrayView'),contrast:val('xrayContrast'),extra:priorXrays==='no'?'Prior X-rays: 0':`Prior X-rays: ${val('xrayCount')} (verified)`};
    if(modality==='CT scan') { let target=val('ctType')==='Others'?val('ctTypeOther'):val('ctType'); if(val('ctType')==='Chest') target+=` (${val('ctChestSubtype')})`; const views=[...document.querySelectorAll('[name=ctView]:checked')].map(x=>x.value==='Others'?val('ctViewsOther'):x.value).join(', '); return {study:`CT scan — ${target}`,view:views,contrast:val('ctContrast'),extra:'Radiologist protocol confirmation required'}; }
    if(modality==='MRI') return {study:`MRI — ${val('mriType')==='Others'?val('mriTypeOther'):val('mriType')}`,view:'Multiplanar',contrast:val('mriContrast'),extra:'Radiologist protocol confirmation required'};
    return {study:`Ultrasound — ${val('usType')==='Others'?val('usTypeOther'):val('usType')}`,view:'Bedside ultrasound',contrast:'N/A',extra:'None'};
  }
  function patientName(){const p=val('prefix')==='Son of'?'S/O':val('prefix')==='Daughter of'?'D/O':'B/O'; const baby=val('pregType')==='Singleton'?'':` (${val('specificBaby')})`;return `${p} ${val('motherName')} & ${val('fatherName')}${baby}`;}
  function clinician(){return `${val('designation')==='RN'?'':'Dr. '}${val('docName')} (${val('designation')})`;}
  function buildText(d){const urgent=priority==='Urgent'?`URGENT — ${val('urgentReason')==='Others'?val('urgentReasonOther'):val('urgentReason')}`:'Routine'; return `*UMC NICU RADIOLOGY REQUEST*\n*Date/Time:* ${pktDisplay()}\n*Patient:* *${patientName()}*\n*MR Number:* *${val('mrNumber')}*\n*Weight:* ${val('weight')}\n*Date of Admission:* ${val('admissionDate')}\n*Admission Status:* ${val('admissionStatus')}${val('admissionStatus')==='Readmitted'?` (${val('readmissionCount')==='Others'?val('readmissionOther'):val('readmissionCount')})`:''}\n*Pregnancy:* ${val('pregType')}${val('pregType')==='Singleton'?'':` (${val('specificBaby')})`}\n*Priority:* ${urgent}\n*Imaging:* ${d.study}\n*View(s):* ${d.view}\n*Contrast:* ${d.contrast}\n*Radiation / Additional:* ${d.extra}\n*Clinical Notes:* ${val('clinicalNotes')}\n*Requested By:* ${clinician()}\n\n*Disclaimer:* For UMC NICU use only. Verify all details before acting.`;}
  function renderSlip(d){const urgent=priority==='Urgent'?`${val('urgentReason')==='Others'?val('urgentReasonOther'):val('urgentReason')}`:''; $('slip').innerHTML=`<div class="slip-head"><div><small>Department of Paediatrics &amp; Neonatology</small><h2>UMC NICU Radiology Request Form</h2><small>UMC NICU Bedside Requisition</small></div><div><b>MR #${escapeHtml(val('mrNumber'))}</b><br><small>${escapeHtml(pktDisplay())}</small></div></div><div class="slip-section"><div class="slip-title">1. Patient identification</div><div class="slip-body"><b>${escapeHtml(patientName())}</b><div class="slip-grid"><span>Weight: <b>${escapeHtml(val('weight'))}</b></span><span>Admission: <b>${escapeHtml(val('admissionDate'))}</b></span><span>Pregnancy: <b>${escapeHtml(val('pregType'))}</b></span><span>Status: <b>${escapeHtml(val('admissionStatus'))}</b></span></div></div></div><div class="slip-section"><div class="slip-title">2. Requested radiology &amp; imaging</div><div class="slip-body"><b>${escapeHtml(d.study)}</b> ${priority==='Urgent'?`<span class="urgent-badge">URGENT</span>`:''}<div class="slip-grid"><span>View(s): <b>${escapeHtml(d.view)}</b></span><span>Contrast: <b>${escapeHtml(d.contrast)}</b></span><span>Priority: <b>${escapeHtml(priority)}</b></span><span>${escapeHtml(d.extra)}</span></div>${urgent?`<div><b>Urgent indication:</b> ${escapeHtml(urgent)}</div>`:''}</div></div><div class="slip-grid"><div class="slip-section"><div class="slip-title">3. Clinical indication</div><div class="slip-body">${escapeHtml(val('clinicalNotes'))}</div></div><div class="slip-section"><div class="slip-title">4. Requesting clinician</div><div class="slip-body"><b>${escapeHtml(clinician())}</b><br>NICU</div></div></div><p style="text-align:center;margin-top:10px;font-size:.7rem;font-weight:800">Verified for clinical radiology duty record • For UMC NICU use only</p>`;}

  $('requestForm').addEventListener('submit',e=>{e.preventDefault();if(!validate())return;const d=details();$('requestText').textContent=buildText(d);renderSlip(d);$('outputSection').hidden=false;$('outputSection').scrollIntoView({behavior:'smooth'});});
  $('copyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('requestText').textContent);setToast('WhatsApp text copied.');}catch{setToast('Copy failed—select the text manually.');}});
  $('printBtn').addEventListener('click',()=>window.print());
  $('resetBtn').addEventListener('click',()=>{if(!confirm('Clear all entries and reset the form?'))return;location.reload();});

  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=4){const words=String(text).split(/\s+/);let line='',lines=[];for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(i===maxLines-1&&lines.length>maxLines?`${l}…`:l,x,y+i*lineHeight));return Math.min(lines.length,maxLines)*lineHeight;}
  function makeCanvas(){const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#0f172a';x.lineWidth=5;x.strokeRect(24,24,1032,1302);x.fillStyle='#0f2744';x.fillRect(24,24,1032,150);x.fillStyle='#fff';x.font='700 25px Arial';x.fillText('Department of Paediatrics & Neonatology',55,70);x.font='900 38px Arial';x.fillText('UMC NICU Radiology Request Form',55,116);x.font='700 22px Arial';x.fillText(`MR #${val('mrNumber')}`,790,75);x.font='20px Arial';x.fillText(pktDisplay(),735,115);const d=details();let y=210;const section=(title,lines,color='#0f2744')=>{x.fillStyle=color;x.fillRect(45,y,990,45);x.fillStyle='#fff';x.font='900 21px Arial';x.fillText(title.toUpperCase(),62,y+30);y+=65;x.fillStyle='#0f172a';for(const [label,text] of lines){x.font='700 22px Arial';x.fillText(`${label}:`,62,y);x.font='22px Arial';const h=wrap(x,text,260,y,740,30,3);y+=Math.max(38,h+8);}y+=18;};section('1. Patient identification',[['Patient',patientName()],['MR number',val('mrNumber')],['Weight / admission',`${val('weight')} • ${val('admissionDate')} • ${val('admissionStatus')}`],['Pregnancy',`${val('pregType')}${val('pregType')==='Singleton'?'':` (${val('specificBaby')})`}`]]);section('2. Requested radiology & imaging',[['Study',d.study],['View(s)',d.view],['Contrast',d.contrast],['Priority',priority==='Urgent'?`URGENT — ${val('urgentReason')==='Others'?val('urgentReasonOther'):val('urgentReason')}`:'Routine'],['Radiation / additional',d.extra]],priority==='Urgent'?'#b91c1c':'#1e3a8a');section('3. Clinical indication',[['Notes',val('clinicalNotes')]]);section('4. Requesting clinician',[['Requested by',clinician()]]);x.fillStyle='#475569';x.font='700 18px Arial';x.textAlign='center';x.fillText('Verified for clinical radiology duty record • For UMC NICU use only',540,1300);return c;}
  $('shareImageBtn').addEventListener('click',()=>{const c=makeCanvas();c.toBlob(async blob=>{if(!blob){setToast('Could not generate the image.');return;}const file=new File([blob],`UMC_NICU_Radiology_${val('mrNumber')}.png`,{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'UMC NICU Radiology Request'});return;}catch(e){if(e.name==='AbortError')return;}}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);setToast('PNG downloaded. Attach it manually in WhatsApp.');},'image/png');});
})();
