COURSE.lesson({
  id:'ch01', kind:'chapter', part:1, num:1,
  title:'The invoice that changed its bank details',
  question:'If an email asks you to pay a new account, who checks it is real?',
  device:'The payment run', minutes:6, questions:[3,4],
  cta:'Open the inbox',
  steps:[
    { title:'The invoice that changed its bank details',
      lede:'If an email asks you to pay a new account, who checks it is real?',
      blocks:[
        {type:'text', html:'<p>This is a fictional training case. You are Priya, a finance clerk. Halden Supplies has been paid by your firm for six years.</p><p>It is Monday 3 March. An email arrives.</p>'}
      ]},
    { eyebrow:'Monday 3 March', title:'Halden has moved banks.',
      blocks:[
        {type:'doc', skin:'email', subject:'New bank details for your next payment', from:'Accounts, Halden Supplies &lt;accounts@halden-supp1ies.com&gt;', to:'Priya', date:'Monday 3 March', html:'<p>We have moved banks. Please pay the next invoice, for £48,200, to our new account.</p>', imagined:true},
        {type:'slider', id:'trust', prompt:'How sure are you that this email is from Halden?', min:0, max:100, step:1, start:60, unit:'%', labels:['Not at all','Certain'], lockLabel:'That sure'},
        {type:'choice', id:'move', prompt:'What do you do?', options:[
          {text:'Update the bank details. The supplier and the invoice are both familiar.', fb:'<b>This is what Priya did.</b> A familiar name and a routine request are exactly what the email was built to look like.'},
          {text:'Reply to the email and ask them to confirm.', fb:'<b>The reply goes to the same people who sent it.</b> They will confirm. That is not a check.'},
          {text:'Call Halden on the number already in your supplier file.', fb:'<b>That is the check the policy asks for.</b> A number you already had cannot be changed by the email.'}
        ]}
      ]},
    { eyebrow:'Look again', title:'Find the line that should have stopped the payment.',
      blocks:[
        {type:'tapfind', id:'spot', skin:'email', subject:'New bank details for your next payment', from:'accounts@halden-supp1ies.com', date:'Monday 3 March', prompt:'Tap the detail that gives the email away.', imagined:true, segments:[
          {text:'We have moved banks.', miss:'Companies do move banks. That alone proves nothing. Look at who sent it.'},
          {text:'The sender is halden-supp1ies.com, with the number 1 in place of the letter l.', hit:true},
          {text:'Please pay the next invoice to our new account.', miss:'A routine request. Look at where it came from.'}
        ], fb:'One character. Nobody reads a sender address that closely on a Monday, which is why the policy does not rely on anyone reading it.'},
        {type:'sit', html:'You were {{trust}} sure. The address was wrong by one character, and the policy already said what to do.'}
      ]},
    { eyebrow:'Wednesday 5 March', title:'The payment run.',
      blocks:[
        {type:'doc', skin:'log', title:'Payment system', meta:'change log', imagined:true, html:'<p>› Mon 3 Mar · Priya · Halden Supplies · bank details changed</p><p>› Wed 5 Mar · Tom · payment run approved · log not opened</p><p>› Wed 5 Mar · £48,200 sent</p>'},
        {type:'quote', text:'Any change to supplier bank details must be confirmed by phone, using a number already on file.', cite:'The firm’s policy'},
        {type:'stat', value:9400, prefix:'£', label:'Recovered by the bank', caption:'Of the £48,200 sent.'}
      ]},
    { eyebrow:'The question every case asks', title:'Who could have checked?',
      blocks:[
        {type:'stop', id:'stop', nodes:[
          {short:'The sender', who:'Someone registers halden-supp1ies.com and sends the email', fb:'<b>The sender was never going to check.</b> The question is who on your side could have.'},
          {short:'Priya', who:'Priya changes the bank details', what:'The policy said: confirm by phone, using a number on file.', stop:true, fb:'<b>Yes.</b> The policy put the check at the moment the bank details changed, and Priya was the person standing there.'},
          {short:'Tom', who:'Tom approves the payment run', what:'He did not open the change log.', tone:'warn', fb:'<b>A second chance, and a real one.</b> But the policy put the check earlier, at the change itself. Find that link.'},
          {short:'The bank', who:'The money leaves; the bank recovers £9,400', fb:'<b>The bank is the backstop, not the check.</b> By then most of the money was gone.'}
        ]}
      ]},
    { title:'Which check does this case turn on?',
      blocks:[
        {type:'toolkit', id:'kit', answer:[4,3], fb:'A change to where money goes needs someone other than the person who made it, and a record that shows it changed.'}
      ]},
    { eyebrow:'Your turn', title:'Write the call you would make.', imagined:true,
      blocks:[
        {type:'reflect', id:'call', prompt:'An email asks you to pay a supplier’s new account. Who do you call, and where do you get the number?', placeholder:'I would call…'}
      ]}
  ],
  finish:{
    headline:'The check was one phone call.',
    takeaway:'When an email asks you to send money somewhere new, call the person back on a number you already had, not one in the email.',
    echo:['call'],
    sources:[{label:'Kit demo case (fictional)', url:'https://example.org/kit-demo-case'}]
  }
});
