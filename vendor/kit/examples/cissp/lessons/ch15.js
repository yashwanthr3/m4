COURSE.lesson({
  id:'ch15', kind:'chapter', part:7, num:15,
  title:'Knight Capital: the eighth server',
  question:'If one of eight servers is different, who would notice?',
  device:'The deployment to eight servers', minutes:10, questions:[4,7],
  cta:'Open the change record',
  steps:[
    { title:'Knight Capital: the eighth server',
      lede:'If one of eight servers is different, who would notice?',
      blocks:[
        {type:'text', html:'<p>Knight Capital was a US broker-dealer, a firm that buys and sells shares for customers and for itself. Its software for sending orders to the stock markets was called SMARS.</p><p>In 2012, Knight was getting ready to put new code on SMARS. You will make each decision in the order it happened.</p>'},
        {type:'stat', prefix:'$', value:460, suffix:' million', label:'Knight’s loss', caption:'August 1, 2012. About 45 minutes of trading.'}
      ]},
    { eyebrow:'Exhibit 1 · The change',
      title:'From July 27, 2012, the new code goes out in stages.',
      lede:'The new code is for RLP, a new program at the New York Stock Exchange. An order can carry a flag. A flag is a marker that tells SMARS which code to run. The RLP code reuses an old flag. That flag once switched on Power Peg, a retired feature. Its code is still on SMARS.',
      blocks:[
        {type:'doc', skin:'form', title:'Change record · RLP code to SMARS', meta:'from July 27, 2012', paraphrase:'Reconstructed from the SEC order. Knight’s own change records are not published.',
          html:'<p><b>Target</b> SMARS production servers, 8</p><p><b>Deployed by</b> one technician</p><p><b>Second review</b> none required</p><p><b>Status</b> reported complete</p>'},
        {type:'choice', id:'signoff', prompt:'The technician reports the deployment complete. Your procedures do not ask for anything more. What do you do?', options:[
          {text:'Accept it. The technician knows these servers, and nothing in the procedures asks for more.', fb:'<b>This is what Knight did, and no rule was broken.</b> The SEC, the US securities regulator, found that “Knight had no written procedures that required such a review.” On a busy team, trusting a colleague is the normal move.'},
          {text:'Ask a second technician to check each server before the open.', fb:'<b>A second pair of eyes.</b> It costs time on a release that looks routine, and it can look like slowing the team down. The next exhibit shows what that person would have been looking at.'},
          {text:'Run an automated check that compares the code on all eight servers.', fb:'<b>A check that does not get tired.</b> Someone has to build it before this release. The next exhibit shows what a comparison of the eight servers would have found.'}
        ]}
      ]},
    { eyebrow:'Exhibit 2 · The servers', teaser:'the eight servers',
      title:'Eight servers should now be identical.',
      lede:'On a server with the new RLP code, the reused flag runs RLP. On a server without it, the same flag runs Power Peg.',
      blocks:[
        {type:'tapfind', id:'server', skin:'log', title:'SMARS production servers', meta:'after the RLP deployment', prompt:'An order carrying the reused flag arrives. Tap the server where that flag would switch on Power Peg.',
          paraphrase:'Reconstructed. The SEC says the new code was not copied to one of the eight servers, and calls it the eighth server. No server list is published.',
          missFb:'That server has the July 27 build, so the reused flag runs RLP there. Look for the server that still hands the flag to old code.',
          segments:[
            {text:'smars-1 · build of July 27 · reused flag handled by: RLP'},
            {text:'smars-2 · build of July 27 · reused flag handled by: RLP', br:true},
            {text:'smars-3 · build of July 27 · reused flag handled by: RLP', br:true},
            {text:'smars-4 · build of July 27 · reused flag handled by: RLP', br:true},
            {text:'smars-5 · build of July 27 · reused flag handled by: RLP', br:true},
            {text:'smars-6 · build of July 27 · reused flag handled by: RLP', br:true},
            {text:'smars-7 · build of July 27 · reused flag handled by: RLP', br:true},
            {text:'smars-8 · build before July 27 · reused flag handled by: legacy code', br:true, hit:true}
          ],
          fb:'<b>The eighth server.</b> The SEC: “one of Knight’s technicians did not copy the new code to one of the eight SMARS computer servers.” On seven servers the flag ran RLP. On the eighth, the same flag ran Power Peg.'},
      ]},
    { eyebrow:'Exhibit 3 · August 1, 2012, from about 8:01 a.m.', teaser:'the emails before the open',
      title:'Before the market opens, SMARS starts sending error emails.',
      lede:'They go to a group of Knight staff. Each one reports an error, and the error names Power Peg. The market opens at 9:30 a.m.',
      blocks:[
        {type:'doc', skin:'email', subject:'SMARS error', from:'SMARS, automated', to:'A group of Knight personnel', date:'August 1, 2012, from approximately 8:01 a.m. ET',
          paraphrase:'The SEC quotes only the error text. The rest of each email is not published.',
          html:'<p>Power Peg disabled</p>'},
        {type:'choice', id:'email', prompt:'You are in that group. The message is short and automated. What do you do?', options:[
          {text:'Leave it. The system is running, and someone on the team owns SMARS.', fb:'<b>A reasonable reading of a terse automated message.</b> It is also what the record shows: “Knight personnel generally did not review them when they were received.” The email named Power Peg, the retired code behind the reused flag.'},
          {text:'Find out who owns SMARS, and tell them before 9:30.', fb:'<b>One call before the open.</b> An error that names retired code, on the morning a change goes live, is worth a person’s attention. Sent to a group, the email gave nobody that job.'},
          {text:'Ask the technician who deployed the RLP code.', fb:'<b>A sensible first call.</b> The person nearest the change knows what the reused flag used to trigger. The email named exactly that code: Power Peg.'}
        ]},
        {type:'stat', value:97, label:'error emails before the 9:30 a.m. open', caption:'The SEC: “Knight personnel generally did not review them when they were received.”'}
      ]},
    { eyebrow:'9:30 a.m. · The open', teaser:'9:30 a.m., the open',
      title:'The market opens. The eighth server starts sending orders.',
      lede:'An order that comes in is a parent order. To fill it, SMARS sends smaller child orders to the market. On the eighth server, Power Peg sends child orders for each parent order, in rapid sequence, without stopping.',
      blocks:[
        {type:'runaway', id:'run1', prompt:'Open the market. The counter shows shares executed.', counter:'Shares executed', unit:'shares', unitOne:'share', rate:2000000, accel:1.3, max:397000000, okBelow:40000000,
          tag:'SMARS · August 1, 2012', meta:'from 9:30 a.m.', startLabel:'Open the market',
          events:['parent order received on smars-8','child order sent','child order sent','Knight position growing','child order sent','child order sent'],
          outcomes:{
            early:'You stopped it early. You knew to watch the counter. Knight had no procedure that put anyone in that seat. The SEC: “On August 1, Knight did not have supervisory procedures concerning incident response.”',
            late:'Late, and still faster than the record. Knight had no written plan for this. The SEC faulted it for having no guidance “as to when to disconnect a malfunctioning system from the market”.',
            max:'This is the real number. The SEC counted “more than 397 million shares in approximately 45 minutes”. Knight had no written guidance “as to when to disconnect a malfunctioning system from the market”.'
          }}
      ]},
    { eyebrow:'During trading', teaser:'the team’s plan: undo it',
      title:'The technology team has a plan: undo the change.',
      blocks:[
        {type:'choice', id:'rollback', prompt:'The team wants to uninstall the new RLP code from the seven servers where it went in correctly. There is no written incident procedure. What do you say?', options:[
          {text:'Approve it. When something breaks right after a release, roll the release back.', fb:'<b>A sensible reflex, and what Knight did.</b> But here the new code was not the fault. The old code on the eighth server was, and the reused flag still pointed at it.'},
          {text:'Take SMARS off the market first, then work out the cause.', fb:'<b>The move nobody had written down.</b> The SEC faulted Knight for lacking guidance “as to when to disconnect a malfunctioning system from the market”. Deciding in advance who may do it is the control.'},
          {text:'Roll back only the server that is different.', fb:'<b>Sharp, if you know which server it is.</b> You do, because you found it in Exhibit 2. Without a check before the open, the team has to find it during trading, under pressure.'}
        ]},
        {type:'quote', text:'Knight uninstalled the new RLP code from the seven servers where it had been deployed correctly. This action worsened the problem.', cite:'SEC order, In the Matter of Knight Capital Americas LLC, ¶27'}
      ]},
    { eyebrow:'The question this course asks of every case', teaser:'two places for the control',
      title:'Where should the control have been?',
      lede:'Here is the chain, in order. Two links could have caught this before the open. Find both.',
      blocks:[
        {type:'stop', id:'stop', afterNote:'Past this point the team was reacting, not preventing.', nodes:[
          {short:'Devs, 2005', who:'Developers moved part of the old Power Peg code and did not retest it', what:'Power Peg was retired in 2003 but left on the servers.', tone:'warn', fb:'<b>A real gap, and a fair pick.</b> The SEC notes Knight “did not retest the Power Peg code”. Deleting dead code removes what a reused flag could wake up. But the two links to find come later.'},
          {short:'Devs, 2012', who:'Developers reused the old Power Peg flag for the new RLP code', what:'The flag now meant one thing with RLP and another without it.', fb:'<b>A fair pick: reusing the flag was risky.</b> But it was a design choice, not a missed check. The flag only fires old code on a server that lacks the new code. A later check could still find that server.'},
          {short:'Deploy', who:'One technician copied the new code to seven of the eight servers', what:'No second technician reviewed it. No written procedure asked for one.', stop:true, fb:'<b>Yes.</b> One person made the change and nobody checked it. A second technician, or an automated comparison of the eight servers, would have shown the eighth server. This is separation of duties applied to a change.'},
          {short:'Alert inbox', who:'97 automated emails reached a group of Knight personnel', what:'From about 8:01 a.m., each said “Power Peg disabled”.', stop:true, fb:'<b>Yes.</b> The system named the old code before the open, 97 times. Sent to a group, the emails belonged to no one. “These notifications were not acted upon before the market opened.”'},
          {short:'Risk tools', who:'Knight’s main risk tool showed positions only after trades and sent no automated alerts', what:'Knight also had no firm-wide capital thresholds linked to its order entry.', tone:'warn', fb:'<b>A real gap, and a fair pick.</b> But this link limits damage after trading starts. It does not prevent the error. You will try a limit like this at the end.'},
          {short:'Tech team', who:'The technology team rolled back the good code on seven servers', what:'There was no written incident procedure.', fb:'<b>A fair pick: the team acted during the crisis.</b> But by then the orders were already running. With no incident procedure the team tried a rollback, and the SEC says “This action worsened the problem.”'}
        ]}
      ]},
    { eyebrow:'The eight questions', teaser:'the question behind one technician',
      title:'One person, eight servers.',
      blocks:[
        {type:'toolkit', id:'kit', answer:[4], fb:'<b>Can one person do this alone?</b> Here, yes. One technician deployed to eight servers, and no procedure asked anyone to check. The CISSP course slides on separation of duties say it “Prevents fraud, errors, and abuse by creating checks and balances.”', fbWrong:'A fair question to ask of this case. But the SEC’s findings keep returning to one person deploying with no second review.',
          why:{
            7:'The deployment was trusted and not checked, so question 7 is a fair reading. The SEC’s finding is narrower: one technician deployed alone, and no procedure required a second person. That is question 4.',
            1:'The 97 emails went to a group, so no one person owned them. That was a real gap, and the second chance. The first chance was one person deploying alone.',
            6:'Knight had no automated limit behind SMARS, so nothing capped the damage. That limits harm. It does not explain how the eighth server was missed.'
          }},
        {type:'reflect', id:'second', prompt:'For your team’s next production change, who, other than the person who makes it, checks that every server runs the same version? Write a name, or write why there is none.', placeholder:'On our next release, the person who checks is…', button:'Keep my answer'}
      ]},
    { eyebrow:'Your turn · a damage cap', imagined:true, teaser:'the open again, with a halt',
      title:'Run the open again, with a halt set in advance.',
      lede:'This run is imagined. A halt does not find the bug. It caps the damage. Knight’s limits were in dollars and were not linked to its order entry. Here the halt is in shares, so you can watch it on the counter.',
      blocks:[
        {type:'runaway', id:'run2', prompt:'Set the halt, open the market, and let it run.', counter:'Shares executed', unit:'shares', unitOne:'share', rate:2000000, accel:1.3, max:397000000, okBelow:0,
          tag:'SMARS · with a pre-set halt', meta:'imagined', startLabel:'Open the market',
          limit:{label:'Halt order entry automatically at', min:5000000, max:200000000, start:50000000, step:5000000},
          events:['parent order received on smars-8','child order sent','child order sent','threshold check','child order sent'],
          outcomes:{
            limit:'The halt fired with nobody watching. A limit set in advance does not depend on someone reading email at 9:30. The SEC found Knight failed “to link pre-set capital thresholds to Knight’s entry of orders”.',
            early:'You stopped it by hand before the halt. Good reflexes, and still a control that depends on you being there.',
            late:'You stopped it by hand. The halt you set would have done it without you.',
            max:'The counter ran out before your halt fired. Set it lower: a limit only works if it sits below the damage.'
          }}
      ]},
  ],
  finish:{
    headline:'Seven servers were right. One wrong server was enough.',
    takeaway:'After every production change, have a second person or an automated check confirm that every server runs the same version. Delete dead code instead of leaving it switched off. Send automated errors to a named owner, not only a group inbox. Write down in advance who may take a system off the market.',
    echo:['second'],
    sit:'At the open you stopped the counter at {{run1}}. The SEC counts about 45 minutes of runaway orders, and Knight had no written guidance on when to disconnect. In the systems you run, who is allowed to stop them, and do they know it?',
    elsewhere:[
      {when:'July 2024', text:'CrowdStrike sent a content update to every machine at once, with no staged rollout. Case 13.'},
      {when:'March 2017', text:'At Equifax, a patch warning went to a large group and did not reach the owner of the system that needed it. Case 14.'}
    ],
    sources:[
      {label:'SEC Order, In the Matter of Knight Capital Americas LLC, Release No. 70694 (October 16, 2013)', url:'https://www.sec.gov/litigation/admin/2013/34-70694.pdf'}
    ]
  }
});
