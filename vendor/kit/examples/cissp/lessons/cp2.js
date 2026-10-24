COURSE.lesson({
  id:'cp2', kind:'checkpoint', part:2,
  title:'Domain 2 exam room',
  question:'Morgan Stanley and PSNI: recall the controls, then four exam-style scenarios.',
  device:'Two exhibits, then the exam room', minutes:10, questions:[2,4,7],
  cta:'Reopen the case files',
  steps:[
    { title:'Domain 2 exam room',
      lede:'What you hold, what you destroy and what you let out.',
      blocks:[
        {type:'text', html:'<p>Domain 2 of the CISSP is asset security. Both its cases were about data leaving: drives with customer data still on them, and a spreadsheet with a hidden worksheet still in it.</p><p>First, recall where the controls belonged. Then four exam-style scenarios, with new terms explained before you need them.</p>'}
      ]},
    { eyebrow:'Exhibit 1 · Case 4, Morgan Stanley',
      title:'The paper the mover sent as proof.',
      lede:'Morgan Stanley Smith Barney (MSSB) received this paper and filed it unread. That was one of two control points in its chain.',
      blocks:[
        {type:'doc', skin:'form', title:'Certificate of Indemnification', meta:'IT Corp B · via Moving Company', stamp:'Filed unread', paraphrase:'Reconstructed from what the SEC order says the certificates showed. Their text is not published.',
          html:'<p><b>Issued by</b> IT Corp B</p><p><b>Confirms</b> IT Corp B has taken possession of the equipment</p><p><b>Accepts</b> the risk of loss</p><p><b>Sent to MSSB as</b> certificates of destruction</p>'},
        {type:'choice', id:'c4', prompt:'From memory: where was the other control point, earlier in the chain?', options:[
          {text:'Choosing a mover with no data destruction expertise', correct:true, fb:'<b>Yes, the first control point.</b> The OCC, the US bank regulator, said the banks “failed to adequately assess the risk of using third party vendors, including subcontractors”. Reading the paper was the second.'},
          {text:'IT Corp B’s decision to buy the drives', fb:'<b>A fair thought: IT Corp B handled the drives.</b> But it believed the drives had already been wiped. The control had to sit with MSSB, which needed the proof.'},
          {text:'The auction site that listed the drives for sale', fb:'<b>A natural guess, since the drives were sold there.</b> But by then they had already left MSSB. A control MSSB owned had to come before that.'}
        ]}
      ]},
    { eyebrow:'Exhibit 2 · Case 5, PSNI', teaser:'Why the second check missed',
      title:'The file had a builder and a checker.',
      lede:'The Police Service of Northern Ireland (PSNI) released a spreadsheet with a hidden worksheet listing its whole workforce. Quality assurance (QA) had signed it off.',
      blocks:[
        {type:'choice', id:'c5', prompt:'From memory: why did the QA check not stop it?', options:[
          {text:'QA missed a worksheet hidden from view', correct:true, fb:'<b>Yes.</b> The worksheet was hidden, and QA did not catch it. The ICO, the UK data protection regulator, found the “internal procedures and sign-off protocols” inadequate.'},
          {text:'There was no QA step before the release', fb:'<b>A fair guess, since the check failed.</b> But there was a QA step, and it signed the file off. Having a check was not the problem. Where it looked was.'},
          {text:'The person who built the file also checked it', fb:'<b>A fair suspicion: that would break separation of duties.</b> But the record does not say so. It says QA did not catch the hidden worksheet.'},
          {text:'The file was uploaded before QA had finished', fb:'<b>A reasonable worry: a rushed release is a real risk.</b> But the record says QA did not catch the hidden worksheet, not that it was skipped. The file was signed off, then uploaded.'}
        ]}
      ]},
    { eyebrow:'Retrieval · the question', teaser:'The question both cases share',
      title:'One question links both cases.',
      blocks:[
        {type:'toolkit', id:'kit', prompt:'MSSB filed a certificate unread. PSNI signed off a file with a hidden sheet in it. Which question do both cases test? Tap one.', answer:[7], why:{
          2:'Question 2 fits MSSB’s choice of mover, and it was the answer in Case 4. But PSNI took on no supplier. The question both cases share is about checking what you were handed.',
          4:'Question 4 can fit PSNI, where quality assurance and sign-off were separate steps. But MSSB’s gap was not one person acting alone. What both cases share is a check that did not verify.',
          1:'Both cases had owners: MSSB ran its project, and PSNI staff signed off the file. Nobody was missing. A real check was.'},
          fb:'<b>Even when we trust it, who verifies?</b> MSSB trusted its vendor’s label and did not review the paper. PSNI’s sign-off did not find the hidden worksheet. In both, a check existed and did not look far enough.', fbWrong:'A fair question for one of the two cases. The one they share is about verifying what you were handed.'}
      ]},
    { eyebrow:'Exam-style · scenario 1', imagined:true, teaser:'A storeroom of old tapes',
      title:'A storeroom holds years of old backup tapes.',
      lede:'This scenario is imagined. Nobody can say why the tapes are kept, or who decided. Retention means how long you keep data before you get rid of it. To sanitize media means to remove the data from it.',
      blocks:[
        {type:'choice', id:'x3', prompt:'What should the security manager do FIRST?', options:[
          {text:'Keep every tape, since deletion cannot be undone', fb:'<b>A careful instinct, misapplied here.</b> Keeping data is also a risk: every tape is something to lose. MSSB had about 8,000 tapes and never received a certificate of destruction for them.'},
          {text:'Set a documented retention period for the tapes', correct:true, fb:'<b>Best answer.</b> The CISSP course slides say: “Retention should be a deliberate, documented decision.” That is the CISSP view: policy before procedure. Decide how long each kind of data must be kept. Only then sanitize what is past that date, with proof.'},
          {text:'Encrypt every tape and keep them in the storeroom', fb:'<b>A sensible control, but not the first step.</b> It lowers the cost of losing a tape. But it does not answer why the tapes are kept, which is the decision the slides ask for first.'},
          {text:'Have a vetted vendor destroy all tapes this month', fb:'<b>A fair pick: vetting the vendor is the lesson of Case 4.</b> But it is a procedure with no policy behind it. Destroying everything with no retention decision may destroy data you must keep. Decide first, then destroy.'}
        ]}
      ]},
    { eyebrow:'Retrieval · the controls', teaser:'Three kinds of control',
      title:'Sort the controls from both cases.',
      lede:'Three folders. <b>Know what you hold</b>: a list of what exists. <b>Prove it was destroyed</b>: evidence after disposal. <b>Check what you release</b>: a look before anything goes out.',
      blocks:[
        {type:'sort', id:'controls', prompt:'Which kind of control is each one? Tap a folder for each card.', buckets:['Know what you hold','Prove it was destroyed','Check what you release'], items:[
          {text:'An inventory of every drive, down to serial number', bucket:0, why:'A list of what exists. Without it there is nothing to match a certificate against.'},
          {text:'A record of which customer data sits on each device', bucket:0, why:'The OCC said the banks “failed to maintain an appropriate inventory of customer data stored on the devices.”'},
          {text:'A certificate of destruction that lists each serial number', bucket:1, why:'MSSB received Certificates of Indemnification instead, and did not review them.'},
          {text:'Matching that certificate to the inventory before paying', bucket:1, why:'MSSB paid for wiping that was never performed. A match against the inventory is how you prove each device was destroyed.'},
          {text:'Copying only the needed figures into a new, clean file', bucket:2, why:'A clean file has nothing hidden in it. PSNI released its working file.'},
          {text:'A second person checks for hidden sheets, rows and columns', bucket:2, why:'PSNI’s QA did not find the hidden worksheet. A second check has to know where to look.'}
        ], fb:'MSSB’s gaps sat in the first two folders. PSNI’s sat in the third.'}
      ]},
    { eyebrow:'Exam-style · scenario 2', imagined:true, teaser:'Clear, purge or destroy',
      title:'Drives from a closed data center will be sold.',
      lede:'This scenario is imagined. The CISSP course slides name three levels: “Data sanitization: clearing, purging, and destruction.” The card explains each one.',
      blocks:[
        {type:'doc', skin:'form', title:'Data sanitization levels', meta:'three levels, weakest first', paraphrase:'A summary card written for this course.',
          html:'<p><b>1 · Clearing</b> overwrites the data, so normal tools cannot read it. The drive can be reused.</p><p><b>2 · Purging</b> removes the data so that even a lab cannot recover it. One way to purge is a drive’s built-in secure erase command, which leaves the drive reusable. Another is degaussing, erasing with a strong magnet, which usually leaves a hard drive unusable.</p><p><b>3 · Destruction</b> breaks the drive, for example by shredding it. Nothing can be reused.</p>'},
        {type:'choice', id:'x4', prompt:'The drives held customer data and will be resold to the public. Which level BEST fits?', options:[
          {text:'Clearing, by overwriting the drives once', fb:'<b>A reasonable level for reuse inside your own organization.</b> These drives leave your control. A buyer with lab tools must not be able to recover the data, so clearing is not enough.'},
          {text:'Purging, with the secure erase command', correct:true, fb:'<b>Best answer.</b> The CISSP view: pick the level that protects the data and still meets the business need. The drives leave your control, so even a lab must not recover the data. Secure erase does that, and the drives can still be sold.'},
          {text:'Destruction, by shredding every drive', fb:'<b>A safe choice: destruction is the strongest level.</b> It protects the data, but it fails the business need. A shredded drive cannot be sold. Purging protects the data as well and keeps the drives usable.'},
          {text:'Purging, by degaussing every drive', fb:'<b>Close: degaussing is a kind of purging, so the data is safe.</b> But the card says degaussing usually leaves a hard drive unusable, and these drives are to be sold. The secure erase command purges and keeps them working.'}
        ]}
      ]},
    { eyebrow:'Exam-style · scenario 3', imagined:true, teaser:'The vendor’s paperwork',
      title:'A retailer is retiring 300 laptops.',
      lede:'This scenario is imagined. A disposal vendor collected them, and says it wiped the drives.',
      blocks:[
        {type:'tapfind', id:'x1', skin:'form', title:'Certificate of destruction', meta:'disposal vendor · 300 laptops', stamp:'Received', imagined:true, prompt:'The vendor’s paperwork has arrived. Tap the line that means you cannot prove the data was destroyed.',
          segments:[
            {text:'Devices: 300 laptops collected', miss:'A count is useful, but it is not the gap. Three hundred of what, exactly?'},
            {text:'Method: drives wiped before resale', br:true, miss:'It names a method. On its own it still does not tie the proof to your devices.'},
            {text:'Serial numbers: not listed', br:true, hit:true},
            {text:'Signed: vendor operations manager', br:true, miss:'A signature says who vouches for it. It does not tell you which laptops it covers.'}
          ],
          fb:'<b>No serial numbers, nothing to match.</b> Without them you cannot check this paper against your asset inventory, or tell which laptops it covers. MSSB’s gap was paper nobody matched to an inventory.'}
      ]},
    { eyebrow:'Exam-style · scenario 4', imagined:true, teaser:'A file going out today',
      title:'An analyst must publish figures today.',
      lede:'This scenario is imagined. The figures sit in a workbook that also holds an HR sheet with staff names. The answer goes online this afternoon.',
      blocks:[
        {type:'choice', id:'x2', prompt:'Which control BEST keeps the staff data out of what is published?', options:[
          {text:'Copy only the required figures into a new file', correct:true, fb:'<b>Best answer.</b> A new file holds only what you put in it, so there is nothing left to hide or miss. The CISSP view: a control that removes the risk beats one that tries to catch it. A second person can still check the new file.'},
          {text:'Delete the HR sheet from the workbook, then publish', fb:'<b>Better than hiding it, and it looks finished.</b> But you only delete what you can see. Hidden rows, columns or other hidden sheets would still go out. At PSNI the problem was a worksheet nobody saw.'},
          {text:'Have a second person check the workbook for hidden data', fb:'<b>A real control: separation of duties.</b> But it catches problems instead of removing them. PSNI had a QA sign-off, and it missed the hidden worksheet. A check works best on a file that is clean to begin with.'},
          {text:'Ask the requester to confirm which figures are needed', fb:'<b>Good practice: checking the scope saves work.</b> But it does not change what is inside the file. The HR sheet would still travel with the answer.'}
        ]}
      ]},
    { eyebrow:'Before you leave the domain', teaser:'Your own disposal and release',
      title:'Your own disposal and release.',
      blocks:[
        {type:'reflect', id:'own', prompt:'One line is enough. Which disposal or file release in your team relies on a paper or a screen that nobody checks in detail?', placeholder:'For example: laptops we return to the leasing company', button:'Keep my answer'}
      ]}
  ],
  finish:{
    headline:'Know what you hold. Prove what you destroyed. Check what you release.',
    takeaway:'Keep an inventory down to serial number, and decide in writing how long each kind of data is kept. When it goes, choose clearing, purging or destruction, and match the certificate to your inventory before you pay. Release only clean files, built new and checked by a second person.',
    echo:['own'],
    sit:'You sorted {{controls}} controls correctly. In both cases, more left the building than anyone checked. What would your team find if it listed everything in the next box or file that leaves?',
    sources:[
      {label:'SEC Order, In the Matter of Morgan Stanley Smith Barney LLC, Release No. 34-95832 (September 20, 2022)', url:'https://www.sec.gov/litigation/admin/2022/34-95832.pdf'},
      {label:'ICO, “What price privacy? Poor PSNI procedures culminate in £750k fine” (3 October 2024)', url:'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2024/10/what-price-privacy-poor-psni-procedures-culminate-in-750k-fine'}
    ]
  }
});
