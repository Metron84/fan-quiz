# Are You Really a Fan? Question verification log

Checked 7 Oct 2026. 60 questions across Chelsea, Spurs, West Ham, Arsenal. 43 checked against a source, 17 are established record facts (listed at the end).

## Errors found and fixed

### Chelsea
- chelsea-100-c3: answer was "Chelsea", the category name, so it was a free answer. Replaced with Lampard (211 goals, club record).
- chelsea-300-c1: true/false clue is a coin flip under negative scoring. Replaced.
- chelsea-300-c2: Drogba is not the all-time Premier League scorer. Lampard has 147, Drogba 104. Clue rewritten.
- chelsea-400-c3: Fabregas joined Chelsea from Barcelona in 2014 and never played for Spurs. Replaced with Ashley Cole (2006 swap with Gallas).
- chelsea-500-c1 and c2: Drogba was the answer three times in the category. Replaced with the 103-goal season and Zola.
- chelsea-500-c3: 1971 was not Chelsea's only Cup Winners' Cup. They also won in 1998. Rewritten as "only English club to win it twice".

### Spurs
- spurs-100-c2: "spurs" was an accepted answer and is the category name. Removed.
- spurs-200-c1: Kane scored 30 league goals in 2017-18 and 2022-23, so "first" was ambiguous. Replaced with Lineker (35 goals in 1991-92).
- spurs-300-c1: Pochettino managed Chelsea after Spurs, not before. Fixed to "later".
- spurs-300-c2: Spurs have three 5-0 wins over Arsenal (1901, 1911, 1983). Rewritten to 1983 with the Hughton detail.
- spurs-300-c3: the 1991 semi-final finished 3-1, so "the only goal" was wrong. Rewritten.
- spurs-400-c2 and 200-c1: Kane was the answer twice. Fixed.
- spurs-500-c3: clue gave away the year asked in spurs-200-c3. Reworded.
- Added: 2025 Europa League clue (Postecoglou, Brennan Johnson winner v Man United).

### West Ham
- westham-100-c3: Rice was the answer in three places across the file. Replaced with London Stadium.
- westham-200-c2: Hurst scored one of three in the 3-2 win over Preston (Sissons, Hurst, Boyce). "The only goal" was wrong.
- westham-300-c3: no Cottee hat-trick at Highbury in 1987 found. West Ham won 3-1 at home in April 1987 (Cottee 2), drew 0-0 at Highbury in Nov 1986, lost 0-1 there in Sept 1987. Removed.
- westham-500-c3: Carragher scored an own goal for Liverpool. Gerrard scored twice (54', 90+1'). Answer fixed.
- westham-500-c1: "name any two" cannot match an exact-string list. Now uses answerGroups with requiredCount 2.

### Arsenal
- arsenal-100-c3: Rice duplicate. Replaced with Wenger.
- arsenal-200-c3: Ramsey started the 2014 final. He scored the 109th-minute winner and did not come off the bench.
- arsenal-300-c1: Ramsey's 2017 winner came in the 79th minute, not extra time, and he was already an answer elsewhere. Now asks for Sanchez (4th minute opener).
- arsenal-300-c3: Gallas played for Chelsea, Arsenal and Tottenham, so the old clue was ambiguous. Now asks for the first player to play for all three.
- arsenal-400-c1: Arsenal did not knock Chelsea out in 2005-06. They lost the final to Barcelona. Replaced.
- arsenal-400-c2: mirrored Chelsea's 2019 Europa League clue, so each leaked the other. Replaced with Linighan.
- arsenal-400-c3: Fabregas left Arsenal for Barcelona in 2011. Replaced with Sol Campbell (free transfer 2001).
- arsenal-500-c2: Henry's famous solo goal at Highbury in 2004 was against Liverpool, not Chelsea. Fixed.

## Confirmed as written
- Chelsea 6-0 Arsenal, 22 March 2014 (2013-14), Wenger's 1,000th game.
- Gullit, first foreign manager to win a major trophy with an English club (1997 FA Cup, 2-0 v Middlesbrough).
- Chelsea 103 league goals in 2009-10, Drogba Golden Boot with 29.
- Spurs 5-1 Atletico Madrid, 1963 Cup Winners' Cup, first British club to win a European trophy.
- Woodgate extra-time winner, 2008 League Cup final, 2-1 v Chelsea.
- West Ham 2-0 TSV 1860 Munich, 1965 (Sealey 2). West Ham 4-0 Chelsea in 1981 and 1986.
- West Ham 2-1 Fiorentina, 2023 Europa Conference League (Bowen 90').
- Arsenal 2-1 Chelsea, 2020 FA Cup final (Aubameyang 2). Arsenal 6-0 Spurs, 6 March 1935.
- Arsenal won both 1993 cup finals against Sheffield Wednesday (FA Cup after a replay).

## Established record facts, not individually sourced
Quick eyeball recommended, all are uncontroversial.
- chelsea-100-c1 (Stamford Bridge since 1905), chelsea-100-c2 (blue).
- chelsea-200-c1 (2019 Europa League final 4-1 in Baku), chelsea-200-c3 (Mourinho double 2004-05).
- chelsea-300-c1 (2021 final v Man City), chelsea-300-c2 (Drogba equaliser and winning penalty, 2012).
- spurs-100-c1 (stadium name), spurs-100-c2 (Lilywhites), spurs-500-c3 (Ajax comeback).
- westham-100-c1 (Upton Park, 112 years), westham-100-c2 (Hammers), westham-100-c3 (London Stadium).
- westham-400-c3 (1980 FA Cup final v Arsenal, Brooking), westham-500-c1 (Moore, Hurst, Peters in 1966).
- arsenal-100-c2 (Gunners), arsenal-100-c3 (Wenger 1996 to 2018), arsenal-200-c1 (2002 FA Cup final 2-0 v Chelsea).

## Design rules baked into the data
- Every category and value cell has 3 variants (4 categories x 5 values x 3 = 60).
- No accepted answer equals its own category name.
- No answer appears inside its own clue (validated by script).
- `tags` mark questions about the same event, so the server never draws two of them in one session. Without this, one clue gives away another answer.
- Year, season and decade answers use `matchMode: strict`. Names use length-scaled fuzzy matching.
- Pool is thin for a prize game. Aim for 5 variants per cell before launch.
