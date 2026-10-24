COURSE.lesson({
  id:'ch04', kind:'chapter', part:2, num:4,
  title:'Morgan Stanley: the drives that went to auction',
  question:'When old hardware leaves the building, who proves the data did not leave with it?',
  device:'The decommissioning work order', minutes:10, questions:[2,7,8],
  cta:'Open the work order',
  steps:[
    { title:'Morgan Stanley: the drives that went to auction',
      lede:'When old hardware leaves the building, who proves the data did not leave with it?',
      blocks:[
        {type:'text', html:'<p>In 2016, Morgan Stanley Smith Barney (MSSB) closed two data centers, in New York and Ohio. Everything inside had to go, including drives and tapes full of customer data.</p><p>First the data had to be destroyed: wiped, degaussed (erased with a strong magnet) or physically destroyed. The proof was to be a certificate of destruction: a paper stating that the data on each device was destroyed.</p><p>You sign the paperwork, then follow one drive out.</p>'}
      ]},
    { eyebrow:'Exhibit 1 · The work order',
      title:'The decommissioning project needs a vendor.',
      lede:'The Securities and Exchange Commission (SEC), the US securities regulator, calls the vendor “Moving Company”.',
      blocks:[
        {type:'doc', skin:'form', title:'Work order · Data center decommissioning', meta:'MSSB · 2016', paraphrase:'Reconstructed from the SEC order. MSSB’s own work order is not published.',
          html:'<p><b>Scope</b> about 4,900 devices and about 8,000 back-up tapes</p><p><b>Vendor</b> Moving Company</p><p><b>Wiping</b> a specialist firm, hired by the mover</p><p><b>Proof</b> certificates of destruction</p>'},
        {type:'choice', id:'vendor', prompt:'The mover will pack and haul the hardware and pass the wiping to a specialist. The contract asks for certificates. Do you approve the vendor?', options:[
          {text:'Approve it. The mover handles the hardware, a specialist wipes it, and the certificates prove it.', fb:'<b>This is what MSSB did, and on paper the plan covers everything.</b> The cost: the SEC found the moving company had no experience or expertise in data destruction. The whole plan now rests on a subcontractor and a piece of paper.'},
          {text:'First ask the mover to show it can destroy data, and to name every subcontractor who will touch a drive.', fb:'<b>Due diligence before signing.</b> It slows the project and may annoy a vendor you already use. A bank regulator later said the banks “failed to adequately assess the risk of using third party vendors, including subcontractors”.'},
          {text:'Hire a data destruction firm directly, and keep the mover for moving.', fb:'<b>Split the job by expertise.</b> It means a second contract and a handover between vendors. The CISSP course slides say it plainly: “We can\'t directly control their security”, so you “Use Contracts to Set Security Expectations”.'}
        ]}
      ]},
    { eyebrow:'Exhibit 2 · The paperwork, 2016', teaser:'the certificates arrive',
      title:'Certificates arrive from the mover.',
      lede:'Early in the project, the mover stopped using the planned wiping firm. Without telling MSSB, it brought in another firm. The SEC calls it IT Corp B. Now the mover emails you the paperwork, and the invoice for wiping is due.',
      blocks:[
        {type:'doc', skin:'email', subject:'Certificates of destruction', from:'Moving Company', to:'MSSB decommissioning project', date:'2016',
          paraphrase:'Reconstructed. The email is not published. The SEC order says the moving company emailed the certificates to MSSB and called them certificates of destruction.',
          html:'<p>Attached: the certificates of destruction for the decommissioned equipment.</p>'},
        {type:'choice', id:'paper', prompt:'What do you do with the certificates?', options:[
          {text:'File them and pay. They came from the vendor, labelled as the certificates the contract asked for.', fb:'<b>This is what MSSB did, and the paper looked right.</b> The cost: the SEC order says MSSB did not review them, and paid for wiping and degaussing that was never performed. Keep your answer in mind for the next exhibit.'},
          {text:'Read one before paying the invoice.', fb:'<b>One read.</b> It takes a minute per certificate, on a project with thousands of devices. The next exhibit shows what that minute would have found.'},
          {text:'Match each certificate against the asset inventory, serial number by serial number.', fb:'<b>The strongest check, and the slowest.</b> It needs an inventory down to serial number, and a bank regulator later found the banks had no proper inventory of customer data on the devices. The next exhibit shows what you would be matching.'}
        ]}
      ]},
    { eyebrow:'Exhibit 3 · The certificate', teaser:'what the paper actually said',
      title:'Here is what the paper actually said.',
      lede:'One legal word before you read. Indemnification is a promise to pay for a loss. It is not a statement that anything was destroyed.',
      blocks:[
        {type:'tapfind', id:'cert', skin:'form', title:'Paperwork from IT Corp B', meta:'forwarded by Moving Company', stamp:'Forwarded', prompt:'You need proof that each drive was wiped. Tap a line that shows this paper is not that proof.', need:1,
          paraphrase:'Reconstructed from what the SEC order says the certificates showed. Their text is not published.',
          segments:[
            {text:'Issued by: IT Corp B', miss:'A reasonable worry: MSSB had not vetted IT Corp B. But who issued a paper does not tell you what it proves. Read what the paper says it is.'},
            {text:'Document type: Certificate of Indemnification', br:true, hit:true, fb:'<b>The paper names itself.</b> A certificate of indemnification promises to pay for losses. It does not say any drive was wiped.'},
            {text:'Possession: IT Corp B has taken possession of the decommissioned equipment', br:true, miss:'A fair suspect: it says nothing about wiping. But it only says where the equipment went. Look for the line that says what kind of promise this paper makes.'},
            {text:'Risk: IT Corp B accepts the risk of loss for the equipment', br:true, hit:true, fb:'<b>This is the promise inside the paper.</b> Accepting the risk of loss means paying if equipment goes missing. It says nothing about the data on it.'}
          ],
          fb:'Either line gives it away: this paper is about who pays, not about the data. For the 8,000 tapes, MSSB never received any certificate of destruction.'},
        {type:'sit', html:'You chose: “{{paper}}.” Think of the last certificate, report or attestation a vendor sent your team. Did anyone read past the subject line?'}
      ]},
    { eyebrow:'Exhibit 4 · Where the drives went', teaser:'where the drives ended up',
      title:'The drives went to auction, unwiped.',
      lede:'The mover sold drives to IT Corp B, and they were resold on an internet auction site. On October 25, 2017, an IT consultant in Oklahoma emailed MSSB: he had bought its drives and could read its data. MSSB bought them back, later recovered more, and had 13 examined.',
      blocks:[
        {type:'slider', id:'pii', prompt:'Guess: how many pieces of customer personal information did the review find on those 13 drives?', min:0, max:300000, step:10000, start:20000, labels:['0','300,000'], answer:140000, tolerance:50000, answerLabel:'At least: ', fbClose:'<b>Close.</b>', fbFar:'<b>You guessed {dir}.</b>', reveal:'At least 140,000 pieces of customer personal information, on only 13 drives. The project’s storage arrays alone held roughly 1,000 hard drives, and the vast majority of the drives were never recovered. Anyone who holds a drive can read its data, unless the data was encrypted: scrambled so it cannot be read without a secret code. The record does not show that the data was misused.'}
      ]},
    { eyebrow:'The question this course asks of every case', teaser:'where the control belonged',
      title:'Where should the control have been?',
      lede:'Here is the chain, in order. Tap where someone at MSSB was in a position to catch this before a drive reached an auction. There are two links to find.',
      blocks:[
        {type:'stop', id:'stop', nodes:[
          {short:'Project', who:'The MSSB decommissioning project chose a moving company', what:'The SEC said it had no experience or expertise in data destruction.', stop:true, fb:'<b>Yes.</b> The choice of vendor was MSSB’s to make, and the risk of subcontractors was MSSB’s to assess. The OCC, the US national bank regulator, said the banks “failed to exercise proper oversight of the decommissioning of two Wealth Management business data centers”.'},
          {short:'Mover', who:'The moving company dropped the planned wiping firm and used IT Corp B', what:'It did not tell MSSB. MSSB had not vetted IT Corp B.', fb:'<b>A fair pick: this is where the plan broke.</b> But the mover was the party being relied on. A control that depends on the vendor checking itself is not a control. The check had to sit with the client.'},
          {short:'IT Corp B', who:'IT Corp B bought drives and issued Certificates of Indemnification', what:'It understood the devices had already been wiped.', fb:'<b>A reasonable pick, since it took the drives.</b> But IT Corp B believed the wiping had been done. Its paper said only what it did: take the equipment and the risk of loss. As far as it understood, the drives were already blank.'},
          {short:'Oversight', who:'MSSB vendor oversight accepted the paperwork', what:'It did not review the certificates, and paid for wiping that did not happen.', stop:true, fb:'<b>Yes.</b> The certificates were MSSB’s only proof, and nobody read them. Reading one would have shown the word indemnification. Matching serial numbers could have shown which drives had no proof at all.'},
          {short:'Buyers', who:'Auction buyers bought the drives online', what:'Drives with customer data were resold.', fb:'<b>A natural pick, since they had the data.</b> But the buyers bought what was for sale. By the time a drive is listed at auction, the data has already left. Look further up the chain.'},
          {short:'Consultant', who:'An IT consultant in Oklahoma emailed MSSB', what:'October 25, 2017.', fb:'<b>Tempting, because he is why MSSB found out at all.</b> He raised the alarm. That is detection by a stranger, in October 2017. It is luck, not a control MSSB owned.'}
        ]}
      ]},
    { eyebrow:'The eight questions', teaser:'which question this raises',
      title:'A vendor nobody vetted, a paper never reviewed.',
      blocks:[
        {type:'toolkit', id:'kit', prompt:'MSSB hired a mover with no data destruction expertise, then never reviewed the certificates. Tap the question that fits best.', answer:[2,7],
          why:{
            8:'The wiping was the vendor’s job, but the duty to protect the data stayed with MSSB. That is true, and it is the reason the research before hiring had to be MSSB’s.',
            1:'Question 1 is for a system or decision nobody was named to own. The project was clearly MSSB’s. What was missing was the vetting of who it handed the drives to.'
          },
          fb:'<b>Question 2 fits best, and question 7 also counts.</b> Question 2 is primary, because the chain starts there: MSSB chose a mover with no data destruction expertise and never vetted IT Corp B. Question 7 is the second control point: the certificates were trusted and never read.', fbWrong:'A fair question to ask of this case. But the two control points are a vendor nobody vetted (question 2) and certificates MSSB never reviewed (question 7).'},
        {type:'reflect', id:'proof', prompt:'Your team’s last hardware disposal: what proof do you hold that each drive was wiped, and who checked it?', placeholder:'Our proof of destruction is…', button:'Keep my answer'}
      ]},
    { eyebrow:'Your turn · the next disposal', teaser:'the 42 missing devices',
      title:'One more MSSB story: the devices that went missing.',
      lede:'MSSB branches also used WAAS (Wide Area Application Services) devices, network boxes that store fragments of data to speed up traffic between offices. In 2019, MSSB decommissioned 500 of them. Later it found that 42 were missing.',
      blocks:[
        {type:'choice', id:'plan', prompt:'You own the next decommissioning. Which control would have made those 42 missing devices harmless?', options:[
          {text:'A certificate of destruction for each device', fb:'<b>A natural pick: it is the control this lesson has been about.</b> But a certificate proves what happened to devices you still track. These 42 went missing, and a lost device never gets a certificate.'},
          {text:'Encryption, switched on at deployment', correct:true, fb:'<b>Yes.</b> As Exhibit 4 said, data that was encrypted cannot be read without the secret code, so a lost device holds nothing readable. These devices could encrypt, but MSSB switched it on only in 2018. A manufacturer flaw meant data stored before then stayed unencrypted.'},
          {text:'An inventory down to serial number', fb:'<b>A real control: the OCC faulted the banks for lacking a proper inventory of customer data on the devices.</b> An inventory tells you which devices are missing. It does not protect the data on them once they are gone.'}
        ]},
        {type:'sit', label:'Think about it', html:'For your next disposal, who keeps the serial-number inventory, and is the person who reads each certificate different from the person who hired the vendor?'}
      ]}
  ],
  finish:{
    headline:'The paper said indemnification. Nobody read it.',
    takeaway:'Keep an asset inventory down to serial number. Vet every vendor and subcontractor that will touch a drive. Require a certificate of destruction that lists each serial number, and check it against your inventory before you pay. Turn on device encryption at deployment, so a lost drive holds nothing readable.',
    echo:['proof'],
    sit:'At the work order you chose: “{{vendor}}.” MSSB’s plan looked complete on paper too. Which of your vendors is now passing your data to someone you have never vetted?',
    elsewhere:[
      {when:'August 2023', text:'At PSNI, personal data went out inside a spreadsheet that passed its checks. Case 5.'}
    ],
    sources:[
      {label:'SEC Order, In the Matter of Morgan Stanley Smith Barney LLC, Release No. 34-95832 (September 20, 2022)', url:'https://www.sec.gov/litigation/admin/2022/34-95832.pdf'},
      {label:'SEC Press Release 2022-168 (September 20, 2022)', url:'https://www.sec.gov/news/press-release/2022-168'},
      {label:'Infosecurity Magazine, report on the OCC’s $60m penalty (October 2020)', url:'https://www.infosecurity-magazine.com/news/morgan-stanley-fined-60m-over-data'}
    ]
  }
});
