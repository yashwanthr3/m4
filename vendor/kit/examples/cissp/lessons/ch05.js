COURSE.lesson({
  id:'ch05', kind:'chapter', part:2, num:5,
  title:'PSNI: the hidden tab',
  question:'Before a file goes out, who checks what is in it that nobody can see?',
  device:'The FOI response workbook', minutes:9, questions:[4,7],
  cta:'Open the workbook',
  steps:[
    { title:'PSNI: the hidden tab',
      lede:'Before a file goes out, who checks what is in it that nobody can see?',
      blocks:[
        {type:'text', html:'<p>The Police Service of Northern Ireland (PSNI) received two Freedom of Information (FOI) requests. Under FOI law, anyone can ask a public body for information. The requests came through a public website that publishes FOI answers.</p><p>So the answer would be public. You are on the team preparing it. You will build the file, check it and sign it off.</p>'},
        {type:'stat', value:750000, prefix:'£', label:'the ICO’s fine for one spreadsheet', caption:'From the Information Commissioner’s Office (ICO), the UK data protection regulator, in October 2024.'}
      ]},
    { eyebrow:'Exhibit 1 · The export',
      title:'You need figures from the HR system.',
      lede:'Staff download the data from SAP, the PSNI’s human resources (HR) software, as an Excel file with a single worksheet.',
      blocks:[
        {type:'doc', skin:'sheet', filename:'HR export.xlsx', meta:'SAP HR · one worksheet', tabs:[{name:'Sheet1',on:true}], paraphrase:'Reconstructed structure. The file name is invented and no data is shown.',
          html:'<table><tr><th class="rn"></th><th>A</th><th>B</th><th>C</th><th>D</th></tr><tr><td class="rn">1</td><td><b>Surname</b></td><td><b>Initials</b></td><td><b>Rank</b></td><td><b>Dept</b></td></tr><tr><td class="rn">2</td><td>■■■■</td><td>■■■■</td><td>■■■■</td><td>■■■■</td></tr><tr><td class="rn">3</td><td>■■■■</td><td>■■■■</td><td>■■■■</td><td>■■■■</td></tr></table><p class="hint">One row per person. No data shown.</p>'},
        {type:'choice', id:'build', prompt:'You need a handful of figures from this. How do you build the response?', options:[
          {text:'Work the figures out in new tabs in the same workbook, then tidy it up before release.', fb:'<b>This is what PSNI staff did, and it is the quickest route.</b> The cost: while analysing the data, they added more worksheets. The raw staff data now travels with the answer.'},
          {text:'Work out the figures, then copy only the figures into a new, clean file.', fb:'<b>Never release a working file.</b> It takes an extra step and a second file to keep track of. But a new file holds only what you put in it, so there is nothing hidden to find later.'},
          {text:'Export the final figures to a plain format such as CSV.', fb:'<b>A plain format.</b> A CSV (comma-separated values) file is plain text. It holds one table and nothing else, so it cannot carry a hidden worksheet. You lose formatting and formulas, which the answer does not need.'}
        ]}
      ]},
    { eyebrow:'Exhibit 2 · Quality assurance', teaser:'The file reaches your check',
      title:'The response is ready for your check.',
      lede:'Before release, staff deleted all the visible working tabs. You are quality assurance (QA). You open the file to check it.',
      blocks:[
        {type:'doc', skin:'sheet', filename:'FOI response.xlsx', meta:'ready for sign-off', tabs:[{name:'Response',on:true},{name:'Response (cont.)'}], paraphrase:'Reconstructed structure. The ICO describes the sheets, not their contents. No data is shown.',
          html:'<table><tr><th class="rn"></th><th>A</th><th>B</th></tr><tr><td class="rn">1</td><td><b>Requested figures</b></td><td><b>Count</b></td></tr><tr><td class="rn">2</td><td>■■■■■■</td><td>■■</td></tr><tr><td class="rn">3</td><td>■■■■■■</td><td>■■</td></tr><tr><td class="rn">4</td><td>■■■■■■</td><td>■■</td></tr></table><p class="hint">The figures the requester asked for. Not shown.</p>'},
        {type:'choice', id:'qa', prompt:'Everything you can see is what was asked for. Do you sign it off?', options:[
          {text:'Sign it off. The visible sheets hold only the requested figures.', fb:'<b>The natural check, and it ends where PSNI’s did.</b> Quality assurance did not catch what was in the file. The ICO later found PSNI’s “internal procedures and sign-off protocols” inadequate. Checking only what is on screen is not enough.'},
          {text:'Before signing, open the list of every sheet, including hidden ones.', fb:'<b>A deliberate look behind the screen.</b> It takes a minute, if someone has told you to do it. The next exhibit is that list.'},
          {text:'Ask someone who did not build the file to check it before you sign.', fb:'<b>Separation of duties.</b> The CISSP course slides describe it: “Distributes critical tasks among multiple individuals.” A fresh pair of eyes helps, but only if they know to look past the visible tabs. The next exhibit shows what they would need to look for.'}
        ]}
      ]},
    { eyebrow:'Exhibit 3 · Every sheet in the file', teaser:'Every sheet, hidden ones included',
      title:'Here is the sheet list, hidden ones included.',
      blocks:[
        {type:'tapfind', id:'tab', skin:'sheet', filename:'FOI response.xlsx', meta:'Unhide · all worksheets', tabs:[{name:'Response',on:true},{name:'Response (cont.)'},{name:'Sheet1',hidden:true}], prompt:'Read what each sheet holds. Tap the one that should not be in a public answer.',
          paraphrase:'Reconstructed structure from the ICO’s description. Sheet names are invented. No data is shown.',
          segments:[
            {text:'Response · requested figures (counts)', miss:'This is the sheet the requester asked for. It holds counts, not people.'},
            {text:'Sheet1 · surname, initials, rank, department, one row per person', br:true, hit:true},
            {text:'Response (cont.) · more requested figures (counts)', br:true, miss:'Also part of the answer: counts, not people. Read what each sheet holds.'}
          ],
          fb:'<b>The original worksheet stayed in the file.</b> It was hidden, and QA did not catch it. The ICO: it listed surnames, first-name initials, job role, rank, grade, department, post location, contract type, gender, and service and staff numbers.'}
      ]},
    { eyebrow:'Exhibit 4 · What the hidden sheet held', teaser:'How many people were listed',
      title:'One row per person. How many rows?',
      lede:'The hidden worksheet had one row for each serving officer and member of staff.',
      blocks:[
        {type:'slider', id:'rows', prompt:'Guess: how many people were on the hidden worksheet?', min:0, max:20000, step:100, start:500, labels:['0','20,000'], answer:9483, tolerance:2000, answerLabel:'People listed: ', fbClose:'<b>Close.</b>', fbFar:'<b>You guessed {dir}.</b>', reveal:'The ICO counted 9,483 serving PSNI officers and staff: the whole workforce. The number shows the scale: one hidden sheet held every person in the organisation, with rank and post location. The Information Commissioner, John Edwards, spoke of a real fear for people’s lives:'},
        {type:'quote', text:'tangible fear of threat to life', cite:'John Edwards, UK Information Commissioner'}
      ]},
    { eyebrow:'Exhibit 5 · 8 August 2023', teaser:'Who raised the alarm',
      title:'The file goes up at 14:31.',
      lede:'The website is WhatDoTheyKnow (WDTK). The answer is now public. QA has already signed it off.',
      blocks:[
        {type:'choice', id:'alarm', prompt:'Who do you think raised the alarm?', options:[
          {text:'PSNI’s quality assurance team, on a second look', fb:'<b>A reasonable hope: a check could look again.</b> But QA had already signed the file off, and the record does not say it looked again. The alarm came from PSNI officers.'},
          {text:'Officers from PSNI’s own workforce', correct:true, fb:'<b>Yes, PSNI’s own officers.</b> They alerted the organisation around 16:10. By then the file had been public for more than an hour and a half.'},
          {text:'WDTK, the website', fb:'<b>A fair guess, because WDTK did act.</b> It hid the file at 16:51. But the record says PSNI officers raised the alarm first. The ICO places the responsibility on PSNI’s procedures, not on WDTK.'}
        ]},
        {type:'doc', skin:'log', title:'Release timeline', meta:'8 August 2023', paraphrase:'Times from the ICO. The layout is reconstructed.',
          html:'<p>14:31 · file uploaded to WDTK</p><p>around 16:10 · PSNI officers alert the organisation</p><p>16:51 · WDTK hides the file</p>'}
      ]},
    { eyebrow:'The question this course asks of every case', teaser:'Where the control belonged',
      title:'Where should the control have been?',
      lede:'Here is the chain, in order.',
      blocks:[
        {type:'stop', id:'stop', hint:'Tap the two links where someone could have caught the hidden sheet before 14:31.', nodes:[
          {short:'Requester', who:'A requester sent two FOI requests through WDTK', what:'3 August 2023.', fb:'<b>A natural first tap, but asking is what FOI is for.</b> The requester used a public route the law allows. Nothing in the record places a control there.'},
          {short:'Export', who:'Staff exported raw HR data and added worksheets', what:'They worked out the figures inside the same file.', tone:'warn', fb:'<b>A fair pick: a clean file from the start would have kept the raw data out.</b> But exporting data to analyse it is ordinary work. The ICO points to the later steps, which should have caught what the export brought in.'},
          {short:'Clean-up', who:'Staff deleted the visible tabs before release', what:'The original worksheet stayed in the file.', stop:true, fb:'<b>Yes.</b> The clean-up removed what could be seen and left what could not. A check for hidden sheets here, or a new clean file, could have ended the chain.'},
          {short:'QA sign-off', who:'Quality assurance signed the file off', what:'It did not find the hidden worksheet.', stop:true, fb:'<b>Yes.</b> This was the second pair of eyes, and the hidden worksheet got past it too. A check only finds what it is told to look for. The ICO said “simple-to-implement procedures could have prevented the serious breach”.'},
          {short:'Upload', who:'The file was uploaded to WDTK', what:'14:31 on 8 August 2023.', fb:'<b>Understandable, since this is where it went public.</b> By now the file was out. Uploading was the last step of a process that had already passed its checks. The control belonged before this.'},
          {short:'Officers', who:'PSNI officers spotted it and raised the alarm', what:'Around 16:10. WDTK hid the file at 16:51.', fb:'<b>Fast, and still after release.</b> Officers and WDTK acted within hours. Detection limits the harm. It cannot take the file back from anyone who already has it.'}
        ]}
      ]},
    { eyebrow:'The eight questions', teaser:'The question behind it',
      title:'The check that looked only at the screen.',
      blocks:[
        {type:'toolkit', id:'kit', prompt:'Which of the eight questions does this case test most? Tap one.', answer:[7,4], why:{
          6:'There were two layers, the clean-up and the QA check. Both missed the hidden worksheet, so the second layer had the same blind spot as the first.',
          1:'The file had owners: staff built it and QA signed it. Nobody was missing. A check was.'},
          fb:'<b>Question 7 is primary, and question 4 also counts.</b> Quality assurance and sign-off existed, so the file did not rest on one person alone. What failed was the verifying: the check never looked past the screen. A second check works only when it looks where the first person did not.', fbWrong:'A fair question to ask of this case. But the ICO’s finding was about sign-off: the check before release.'},
        {type:'reflect', id:'check', prompt:'The next file your team releases outside: what does the person who signs it off actually open before signing?', placeholder:'Before we release a file, the checker…', button:'Keep my answer'}
      ]},
    { eyebrow:'Your turn · a check that works', teaser:'The check WDTK built',
      title:'After the breach, WDTK built a check of its own.',
      lede:'mySociety, which runs WDTK, built a tool that holds back spreadsheets that seem to contain hidden data. In its first three months it screened 3,064 files and stopped 21 confirmed data breaches.',
      blocks:[
        {type:'sort', id:'look', imagined:true, prompt:'Practice: how would a checker find each problem? Tap a folder for each card.', buckets:['Visible on screen','Needs a deliberate check'], items:[
          {text:'A wrong total in a visible cell', bucket:0, why:'Anyone reading the sheet can see it. A check of the screen finds it.'},
          {text:'A hidden worksheet', bucket:1, why:'It does not appear when the file opens. You have to look for it.'},
          {text:'Hidden rows inside a visible sheet', bucket:1, why:'The row numbers skip, which is easy to miss. Unhide all before you sign.'},
          {text:'A misspelt heading on the response sheet', bucket:0, why:'On screen and embarrassing, but harmless.'},
          {text:'Hidden columns beside the figures', bucket:1, why:'Like hidden rows, they sit inside a sheet that looks complete.'},
          {text:'A pivot table summary built from the raw HR data', bucket:1, why:'A pivot table can keep a copy of the data it was built from inside the file. The summary looks clean; the source is not on screen.'}
        ], fb:'A hidden worksheet passed PSNI’s check. Nothing in the second folder shows up when you only read the screen. The ICO pointed at procedures: a check has to be told where to look.'}
      ]}
  ],
  finish:{
    headline:'The visible sheets were fine. The file was not.',
    takeaway:'Never release a working file. Copy only the figures you need into a new, clean file, or export to a plain format such as CSV. Before release, check for hidden sheets, hidden rows and columns, and source data, and have a second person sign off. In Edwards’s words: “Check, challenge and change your disclosure procedures to ensure you protect people\'s personal information.”',
    echo:['check'],
    sit:'At the QA check you chose: “{{qa}}.” Every sheet you could see was correct. What file left your organisation this month that nobody opened past the first tab?',
    elsewhere:[
      {when:'October 2017', text:'At Morgan Stanley, an IT consultant found customer data on drives bought at auction. Case 4.'}
    ],
    sources:[
      {label:'ICO, “What price privacy? Poor PSNI procedures culminate in £750k fine” (3 October 2024)', url:'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2024/10/what-price-privacy-poor-psni-procedures-culminate-in-750k-fine'},
      {label:'ICO, Police Service of Northern Ireland monetary penalty notice (3 October 2024)', url:'https://ico.org.uk/action-weve-taken/enforcement/police-service-of-northern-ireland-mpn'},
      {label:'ICO, PSNI facing a £750k fine (23 May 2024)', url:'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2024/05/psni-facing-a-750k-fine-following-spreadsheet-error-that-exposed-the-personal-information-of-its-entire-workforce/'},
      {label:'Northern Ireland Policing Board, independent review “Protecting from Within” (11 December 2023)', url:'https://www.nipolicingboard.org.uk/node/2541'},
      {label:'mySociety, statement on the proposed ICO fine to PSNI (23 May 2024)', url:'https://www.mysociety.org/2024/05/23/statement-on-the-proposed-ico-fine-to-psni/'}
    ]
  }
});
