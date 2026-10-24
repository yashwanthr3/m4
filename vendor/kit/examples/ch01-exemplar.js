COURSE.lesson({
  id:'ch01', kind:'chapter', part:1, num:1,
  title:'The chatbot is not a separate person',
  question:'If a company’s AI tells you something wrong, who answers for it?',
  device:'Tribunal exhibits', minutes:9, questions:[1],
  cta:'Open the case file',
  steps:[
    { title:'The chatbot is not a separate person',
      lede:'If a company’s AI tells you something wrong, who answers for it?',
      blocks:[
        {type:'text', html:'<p>There was no courtroom. Jake Moffatt’s case against Air Canada was decided on paper by British Columbia’s Civil Resolution Tribunal. Each side sent in documents, and one tribunal member, Christopher Rivers, read them all.</p><p>You are going to read the same documents, in the same order, and make each call before you see his.</p>'}
      ]},
    { eyebrow:'Exhibit 1 · A conversation',
      title:'It is 11 November 2022. Your grandmother died today.',
      lede:'You need to fly between Vancouver and Toronto. You open the chatbot on the airline’s website.',
      blocks:[
        {type:'chat', skin:'widget', tag:'aircanada.com', meta:'chat · 11 Nov 2022', botName:'Air Canada chatbot', paraphrase:'Wording paraphrased from the tribunal decision; the 90-day rule is what the chatbot told him.', messages:[
          {from:'you', text:'Do you offer bereavement fares?'},
          {from:'bot', text:'Yes. You can buy a ticket now and apply for the reduced <u>bereavement fare</u> within 90 days.'}
        ]},
        {type:'slider', id:'conf', prompt:'Before you do anything: how sure are you that this answer is right?', min:0, max:100, step:1, start:50, unit:'%', labels:['Not at all','Certain'], lockLabel:'That sure'},
        {type:'choice', id:'move', prompt:'What do you do next?', options:[
          {text:'Book the flights now and apply for the reduced fare afterwards, as the chatbot said.', fb:'<b>That is exactly what Jake Moffatt did.</b> He booked his flights and sent in his refund request within a week. Most people in a hurry, on a day like that, would do the same.'},
          {text:'Click the underlined <u>bereavement fare</u> link and read the policy first.', fb:'<b>One click.</b> You are the first person in this story to check. The next exhibit is where that link went.'},
          {text:'Phone the airline and ask a person.', fb:'<b>Careful, and slow.</b> Notice what you just did: you trusted a person over the company’s own website. The tribunal is about to say those are the same thing.'}
        ]}
      ]},
    { eyebrow:'Exhibit 2 · A web page',
      title:'The words in the chatbot’s answer were a link. Here is where it went.',
      blocks:[
        {type:'tapfind', skin:'web', site:'Air Canada', title:'Bereavement travel', id:'policy', prompt:'Tap the sentence on the airline’s own policy page that contradicts its chatbot.', tag:'Bereavement travel', meta:'aircanada.com', url:'aircanada.com / bereavement travel',
          segments:[
            {text:'Bereavement fares are discounts for people who travel because a relative has died.', miss:'That sentence agrees with the chatbot. Look for the one about <i>when</i> you can claim.'},
            {text:'The discount cannot be claimed after travel.', hit:true}
          ], paraphrase:true,
          fb:'<b>Same website, opposite rules.</b> The chatbot said: buy now, claim within 90 days. The page it linked to said: not after travel. Air Canada refused the refund. An employee later admitted the chatbot had used “misleading words” and offered a $200 coupon. Moffatt went to the tribunal instead.'},
        {type:'sit', html:'You rated the chatbot {{conf}} likely to be right. The answer was one click away, underlined, inside its own reply. What did the convincing: the words, or the tone?'}
      ]},
    { eyebrow:'Exhibit 3 · The airline’s defence',
      title:'Air Canada argued that it should not have to answer for what its chatbot said.',
      blocks:[
        {type:'quote', text:'In effect, Air Canada suggests the chatbot is a separate legal entity that is responsible for its own actions.', cite:'Christopher Rivers, summarising the airline’s argument'},
        {type:'choice', id:'rule', prompt:'You are the tribunal member. Should the airline pay for what its chatbot said?', options:[
          {text:'No. The chatbot came from software the airline does not write word by word.', fb:'<b>A reasonable instinct, and the airline’s own.</b> Nobody at Air Canada typed those words, so why pay for them? Rivers called this “a remarkable submission.” The cost of your rule: every company could blame its bot, and no customer could trust any chat window. Hold your reason; you are about to test it.'},
          {text:'Yes. The chatbot is part of the airline’s website, and the airline answers for its website.', fb:'<b>You ruled as the tribunal did.</b> Notice it follows from what you did in Exhibit 1: a customer cannot tell which part of a site is the trustworthy part. Put your reason into words before you see his.'},
          {text:'Partly. The customer should have read the linked page, so split the loss.', fb:'<b>Fair-minded, and it is what the $200 coupon offered.</b> But the link sat inside the airline’s own answer, and both were the airline’s words. Splitting the loss asks a grieving customer to referee two pages of one website. The tribunal did not split it. Write your reason down.'}
        ]},
        {type:'reflect', id:'why', prompt:'In one sentence: how is a chatbot like, or unlike, an ordinary page on the same website?', placeholder:'A chatbot is different from a web page because…', button:'Show the ruling'},
        {type:'quote', text:'It makes no difference whether the information comes from a static page or a chatbot.', cite:'Christopher Rivers, Moffatt v. Air Canada, 2024 BCCRT 149'},
        {type:'text', html:'<p>The chatbot “is still just a part of Air Canada’s website,” he wrote. A customer had no way to know which part of the site to trust.</p>'}
      ]},
    { eyebrow:'The question this book asks of every case',
      title:'Who could have said stop?',
      lede:'Here is the handover, in order. Place the stop button where someone was placed to stop this before Jake lost his money.',
      blocks:[
        {type:'stop', id:'stop', nodes:[
          {short:'The airline’s people', who:'People at Air Canada put a chatbot in front of grieving customers', what:'They chose what it was allowed to answer, and could change it at any time.', stop:true, fb:'<b>Yes.</b> People at Air Canada chose to put a chatbot in front of grieving customers and chose what it was allowed to answer. They could change it at any time, and their own policy page showed it was wrong.'},
          {short:'The chatbot', who:'The chatbot answered Jake’s question', what:'It wrote a 90-day rule, and linked to the page that said otherwise.', fb:'<b>The chatbot could not.</b> It had no idea it was wrong. Try again: who could have changed what it said?'},
          {short:'Jake', who:'Jake booked, flew, and applied within a week', what:'He trusted the airline’s own chat window on the day his grandmother died.', fb:'<b>Jake could have clicked the link.</b> That would have saved him, but it relies on spare attention on the worst day of a year. The book asks who was <i>placed</i> to stop it. Try again.'},
          {short:'An employee', who:'An employee refused the refund and offered a $200 coupon', what:'Admitted the words were misleading.', tone:'warn', fb:'<b>Close, and late.</b> Jake had already flown. Who could have stopped it before that?'},
          {short:'The tribunal', who:'The tribunal ordered Air Canada to pay', what:'14 February 2024.', fb:'<b>The tribunal did say stop, about fifteen months after the chat.</b> That is the backstop, not the stop button. Try again.'}
        ]}
      ]},
    { eyebrow:'The toolkit', title:'One question, settled on paper.',
      blocks:[
        {type:'toolkit', id:'kit', prompt:'The book’s toolkit is eight questions. Which one did this case settle?', answer:[1], fb:'The tribunal settled <b>who answers for it</b>: the company, for every part of its site. The next chapter picks up question 2, what a chatbot is allowed to do.', fbWrong:'A fair question to ask of this case, but not the one the ruling settled.'}
      ]},
    { eyebrow:'Your turn', title:'A dental clinic adds a chatbot to its website.', imagined:true,
      lede:'This one is imagined. You ask whether a crown is covered by your insurance.',
      blocks:[
        {type:'chat', skin:'widget', tag:'the clinic’s website', meta:'chat · today', botName:'Clinic assistant', messages:[
          {from:'you', text:'Is a crown covered by my insurance?'},
          {from:'bot', text:'Yes, a crown is covered. You can book your appointment now.'}
        ]},
        {type:'choice', id:'clinic', prompt:'A crown costs real money. What do you do before booking?', options:[
          {text:'Book it. The clinic’s own site said yes.', fb:'<b>This is Jake’s move, and you know how it ends.</b> The clinic answers for its bot, but you would still be arguing after the bill arrives.'},
          {text:'Take a screenshot with the date showing, then ask the clinic to confirm it in writing.', correct:true, fb:'<b>That screenshot is your first exhibit.</b> A dated screenshot plus a written confirmation turns “the bot said so” into something the clinic has to answer.'},
          {text:'Ask the chatbot again, more carefully, to be sure.', fb:'<b>Asking the same bot twice gets you the same confidence twice.</b> It cannot check itself. Screenshot, then ask a person in writing.'}
        ]}
      ]},
    { eyebrow:'Switch chairs', title:'Now you run the clinic.', imagined:true,
      lede:'The front desk has just told a patient that crowns are not covered. The bot told them they were.',
      blocks:[
        {type:'fill', id:'names', prompt:'Write down the three names. A blank is where the problem lives.', fields:[
          {label:'Who chose to put the bot on the website?', placeholder:'e.g. the practice manager'},
          {label:'Who decided what it was allowed to answer?', placeholder:'…'},
          {label:'Who checked its answers before patients saw them?', placeholder:'…'}
        ], fbBlank:'The clinic answers for the bot, as Air Canada did for its own. The usual weak spot is the second name: nobody decided that coverage questions belong to a person.', fbFull:'Three names. Now the harder question: was the second person ever told that insurance questions were off limits for the bot? If nobody decided, that blank stays invisible until a patient finds it.'}
      ]},
    { eyebrow:'Exhibit 4 · The order', title:'What a “remarkable submission” cost.',
      blocks:[
        {type:'slider', id:'award', prompt:'Guess: how much did the tribunal order Air Canada to pay, in Canadian dollars?', min:0, max:5000, step:10, start:1500, prefix:'$', labels:['$0','$5,000'], answer:812.02, tolerance:400, answerLabel:'Ordered: ', fbClose:'<b>Close.</b>', fbFar:'<b>You guessed {dir}.</b>', reveal:'A small-claims decision does not bind other courts. Even so, on 14 February 2024 Rivers ordered Air Canada to pay Moffatt $812.02.'},
        {type:'ledger', tag:'Moffatt v. Air Canada', meta:'2024 BCCRT 149', total:812.02, decimals:2, prefix:'$', totalLabel:'Ordered, CAD', rows:[
          ['Fare difference','$650.88'],['Interest','$36.14'],['Tribunal fees','$125.00'],['Total','$812.02','sum']
        ]},
        {type:'text', html:'<p>A coupon worth $200 would have been cheaper. A chatbot that passed bereavement questions to a person would have been cheaper still.</p>'}
      ]}
  ],
  finish:{
    headline:'The chatbot is still just a part of the website.',
    takeaway:'When a company’s chatbot tells you something that matters, such as a refund rule, a deadline or a price, take a screenshot with the date showing. Then ask the company to confirm it in writing. If the chatbot was wrong, that screenshot is your first exhibit.',
    echo:['why'],
    sit:'In Exhibit 1 you chose: “{{move}}.” You were {{conf}} sure. Think of the last answer a company’s AI gave you that you acted on. Did you keep a screenshot?',
    elsewhere:[
      {when:'April 2025', text:'A support bot for the coding app Cursor, signing its emails “Sam,” invented a one-device rule. The company apologised and said AI-written replies would be labelled.'},
      {when:'Chapter 29', text:'New York City’s own chatbot for business owners gave answers that broke city law.'},
      {when:'December 2021', text:'Amazon’s Alexa read a 10-year-old a dangerous “penny challenge” it had found online. Amazon said it had “quickly fixed” the error.'}
    ],
    sources:[
      {label:'Moffatt v. Air Canada, 2024 BCCRT 149 (Civil Resolution Tribunal of British Columbia, 14 February 2024)', url:'https://decisions.civilresolutionbc.ca/crt/crtd/en/525448/1/document.do'},
      {label:'Law360 Canada, “Court rejects Air Canada’s ‘remarkable’ denial of liability” (16 February 2024)', url:'https://www.law360.ca/ca/articles/1804075'},
      {label:'Fanatical Futurist, “Another AI bot causes a mess after inventing a company policy” (May 2025)', url:'https://www.fanaticalfuturist.com/2025/05/another-ai-bot-causes-a-mess-after-inventing-a-company-policy/'}
    ]
  }
});
