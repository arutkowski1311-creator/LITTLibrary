#!/usr/bin/env python3
"""Hike research pass, 2026-09-10.

Descriptions rewritten from a web-search read of AllTrails trail pages (ratings, review counts,
distance, climb, recurring review themes), regional guides (Pure Adirondacks, lakeplacid.com,
saranaclake.com, Adirondack Explorer), Tripadvisor and the ADK forums. No page was scraped:
figures come from search-result summaries of the public trail pages and are stored under
`signals` with the date, and the URLs used are stored under `research.sources`. Prose is ours.
Idempotent. Re-run after editing.
"""
import json, pathlib
P = pathlib.Path(__file__).resolve().parents[1] / "places.json"
d = json.load(open(P)); by = {p["id"]: p for p in d["places"]}
ASOF = "2026-09-10"
AT = "https://www.alltrails.com/trail/us/new-york/"

R = {
"cobble-lookout": dict(rating=4.7, n="2,800+", miles=2.5, climbFt=280, duration="1–1.5 hours",
  review="Built in 2014 and already the most-walked trail in Wilmington: a gently rolling forest path to a broad open ledge with Whiteface, Esther and the High Peaks laid out in front of you. Thousands of reviewers call it the best view-for-effort hike in the area and rate it near-perfect; the recurring notes are that it is family- and dog-friendly, that beginners manage it easily, and that October colour from the lookout is spectacular. Expect company on weekends.",
  know="Trailhead on Gillespie Drive off the Whiteface Memorial Highway approach. Roots, rocks and a little mud; not stroller-friendly. Keep small children back from the unguarded edge.",
  themes=["family-friendly","dog-friendly","beginner","fall colour","view for effort"], src=[AT+"cobble-lookout-wilmington","https://pureadirondacks.com/blogs/adirondack-hiking/cobble-lookout"]),
"cooper-kiln-pond": dict(rating=4.5, n="130+", miles=5.1, climbFt=1158, duration="2.5–3.5 hours",
  review="A quieter walk to a backcountry pond tucked between Morgan Mountain and Wilmington Peak on the shoulder of Whiteface, with a mostly wooded shoreline, a lean-to and real solitude on weekdays. Reviewers describe a steady climb rewarded by a peaceful pond rather than a summit view, and warn about mud after rain and ice in the shoulder seasons; microspikes and a packed lunch are the two most common tips. A 6.2-mile alternative starts from Bonnieview Road.",
  know="From the Whiteface Memorial Highway lot or Bonnieview Road. Muddy after rain; eroded in places; microspikes from November to May.",
  themes=["solitude","pond","muddy","microspikes"], src=[AT+"cooper-kiln-pond-trail",AT+"cooper-kiln-pond-from-bonnieview-road","https://pureadirondacks.com/blogs/adirondack-hiking/cooper-kiln-pond-trail"]),
"copperas-owen-ponds": dict(rating=4.5, n="480+", miles=1.3, climbFt=450, duration="45–90 minutes",
  review="A short, sharp climb from NY-86 in the Notch to a hidden pond with a lean-to, campsites and a mountain backdrop that reviewers rate the best lake trail in the Sentinel Range Wilderness. The write-ups agree on two things: the swimming and the view are worth it, and the first half-mile is steeper and slipperier than the distance suggests. Bring bug spray in June; the trail continues to Owen and Winch ponds if the group wants more.",
  know="Two trailheads on NY-86 in Wilmington Notch; the northern one is the direct, steeper approach. Steep, slippery descents; no stroller. Swim from the rocks by the lean-to.",
  themes=["swimming","hidden pond","steep start","bugs"], src=[AT+"copperas-pond","https://www.lakeplacid.com/story/2012/09/hiking-copperas-pond-trail"]),
"whiteface-via-the-wilmington-trail": dict(rating=4.7, n="1,700+", miles=9.8, climbFt=3600, duration="6–8 hours",
  review="The big local climb: from the Wilmington trailhead over Marble Mountain and Esther's shoulder to the 4,867-foot summit, nearly ten miles round trip with the most sustained elevation gain of any hike in this guide. Reviewers love the workout and the views from the summit ridge, and they are candid about the drawbacks: steep, muddy sections, an unmaintained Esther spur, and a summit you share with the crowd who drove up the Memorial Highway. Start early, carry more water than you think, and treat it as a full day for fit adults.",
  know="Trailhead at the top of the Wilmington Reservoir road. Alpine summit: pack layers even in July. The Memorial Highway crowd means the summit is busy from late morning.",
  themes=["challenging","summit crowds","muddy","start early"], src=[AT+"whiteface-mountain-summit-trail",AT+"whiteface-lookout-and-esther-mountains"]),
"heaven-hill-big-field-loop": dict(rating=4.6, n="790+", miles=0.9, climbFt=60, duration="30–45 minutes",
  review="Three flat, free, beautifully kept loops on a former farm outside Lake Placid: the 0.9-mile Big Field Loop through woods to an open meadow, the 1.4-mile Old Orchard loop with the widest mountain views, and the 1.5-mile Bear Cub loop with cross-trails to shorten or stretch it. Reviewers use the same words again and again: easy, well-marked, stroller-able, dog-friendly, and a perfect first walk with small children or on a winter afternoon.",
  know="Bear Cub Lane, Lake Placid. Free; dogs welcome (off-leash areas). Doubles as a snowshoe and cross-country loop in winter.",
  themes=["stroller","toddlers","dogs","winter walk","free"], src=[AT+"heaven-hills-trail","https://www.lakeplacid.com/hiking/heaven-hill-trails"]),
"brewster-peninsula-short-lake-and-woods-walk": dict(rating=4.6, n="2,100+", miles=2.1, climbFt=98, duration="45–75 minutes",
  review="A nearly flat network of lake-and-woods loops on the peninsula that juts into Lake Placid, with water views, mossy forest and well-marked junctions. Two thousand reviewers rate it an easy family favourite; the only consistent complaints are mud after rain, roots and rocks underfoot, and ferocious mosquitoes in early summer. Leashed dogs welcome.",
  know="Off Whiteface Inn Lane by the golf course. Bug spray and long sleeves in June and July; some muddy stretches.",
  themes=["family","lake views","mud","mosquitoes"], src=[AT+"peninsula-loop","https://www.tripadvisor.com/Attraction_Review-g48023-d1513795-Reviews-Brewster_Peninsula_Nature_Trails-Lake_Placid_New_York.html"]),
"mirror-lake-village-loop": dict(rating=4.6, n="2,200+", miles=2.6, climbFt=60, duration="45–60 minutes",
  review="The sidewalk loop around Mirror Lake in the middle of Lake Placid: benches, beaches, boat rentals and Main Street's ice cream all on the way round. Reviewers recommend it for strollers, wheelchairs, grandparents and dogs, and for the views of Whiteface across the water in evening light. It is a stroll rather than a hike, which is the point.",
  know="Start anywhere; free street parking is easiest at the beach end. Fully paved. Ice-covered stretches in winter.",
  themes=["stroller","accessible","dogs","evening"], src=[AT+"mirror-lake-loop","https://www.lakeplacid.com/story/2010/10/walk-around-lake-placids-mirror-lake"]),
"bloomingdale-bog-short-out-and-back": dict(rating=4.5, n="170+", miles="1–5", climbFt=0, duration="1–2 hours",
  review="A dead-flat old railroad bed through open bog, tamaracks and ponds between Saranac Lake and Bloomingdale, famous for the hand-tame Canada jays that will land on an outstretched hand at the northern end. Reviewers prize the peace and the wildlife (moose sightings are reported), and warn about deer flies in summer and the occasional beaver flooding. Turn around whenever you like; most families go a mile or two.",
  know="Two ends: NY-86 near Saranac Lake or Bigelow Road at the Bloomingdale end (best for the jays; bring unsalted seeds). Deer flies in July; a head net helps. Great cross-country ski in winter.",
  themes=["birding","gray jays","flat","deer flies","winter ski"], src=[AT+"the-bloomingdale-bog-trail","https://www.saranaclake.com/story/2018/07/hiking-and-birding-bloomingdale-bog","https://www.adirondackexplorer.org/recreation/bloomingdale-bog-outing-in-any-season/"]),
"paul-smith-s-vic-barnum-brook-trail": dict(rating=4.5, n="75+", miles=0.7, climbFt=30, duration="20–40 minutes",
  review="A wheelchair-accessible boardwalk-and-gravel loop along Barnum Brook to a beaver lodge and Heron Marsh overlook at the Paul Smith's College Visitor Interpretive Center, with 25 miles of longer trails, a butterfly house and naturalist programmes behind it. Reviewers note easy parking, no crowds and a calm, birdy walk that works for grandparents and toddlers alike.",
  know="Route 30, Paul Smiths; about 50 minutes from the house. Free trails; check the VIC for programme times. Leashed dogs.",
  themes=["accessible","boardwalk","birding","quiet"], src=[AT+"barnum-brook-trail-blue","https://www.adirondackvic.org/TrailMap.html"]),
"mount-jo-via-the-long-trail": dict(rating=4.7, n="5,700+", miles=2.6, climbFt=700, duration="1.5–2.5 hours",
  review="The classic first High Peaks-area summit: a small mountain above Heart Lake with a straight-on view of the MacIntyre Range and Marcy that reviewers describe as the best payoff per mile in the region. Two routes reach the top; almost every parent in nearly six thousand reviews says take the Long Trail up and down with children, because the Short Trail is a steep rock scramble. Arrive early: the Loj lot fills by 7 am on summer weekends and charges a daily fee.",
  know="Adirondak Loj, Heart Lake. Paid parking; check availability before driving out. Long Trail both ways for small children.",
  themes=["family","iconic view","parking fills early","Long Trail with kids"], src=[AT+"mount-jo-loop-trail","https://www.tripadvisor.com/Attraction_Review-g48023-d1948212-Reviews-Mount_Jo-Lake_Placid_New_York.html"]),
"baker-mountain": dict(rating=4.6, n="2,400+", miles=1.7, climbFt=882, duration="1–1.5 hours",
  review="Saranac Lake's town mountain and the easiest of the Saranac Lake 6ers: a short, steep climb from Moody Pond to open ledges over the village, McKenzie Wilderness and the High Peaks. Reviewers call it quick and rewarding and bring dogs and children, with three warnings that repeat: mosquitoes, slick rock after rain, and a poorly marked descent on the loop variant. Parking at the trailhead is tight; Berkeley Green in the village is the overflow.",
  know="Trailhead on Forest Hill Avenue at Moody Pond. Steep for its length; older toddlers will need a hand. Take the same trail down if the loop is unclear.",
  themes=["short and steep","views over village","mosquitoes","parking"], src=[AT+"baker-mountain","https://www.saranaclake.com/hiking/baker-mountain"]),
"mt-van-hoevenberg-east-trail": dict(rating=4.8, n="4,000+", miles=3.8, climbFt=974, duration="2–2.5 hours",
  review="A modern, stair-built trail from the Olympic Sports Complex to a rocky summit with a wide view of the High Peaks, rated among the highest of any hike near Lake Placid. Four thousand reviewers praise the immaculate trail work, clear marking and family-friendly grade; the honest downsides are hundreds of steps on the way up and weekend crowds, so an early start is the standard advice. A good warm-up hike, or the easy day after a big one.",
  know="Park at Mt Van Hoevenberg's Mountain Pass Lodge (fee may apply); trail leaves from behind the lodge. Many stairs; fine for school-age children.",
  themes=["stairs","well built","family","crowds"], src=[AT+"mt-van-hoevenberg-easttrail","https://www.lakeplacid.com/story/2022/mt-van-hoevenberg-faq"]),
"cascade-mountain-from-route-73": dict(rating=4.7, n="6,600+", miles=4.8, climbFt=1940, duration="3.5–5 hours",
  review="The most-climbed of the 46 High Peaks and the easiest way to stand on a bare 4,000-footer, with a rocky open summit and views in every direction. Reviewers rate it highly and describe it plainly: crowded on any fine weekend, muddy for much of the year, with bare-rock scrambles near the top. The consistent advice is to arrive before 8 am (the three roadside lots on Route 73 fill fast) or go late on a long summer evening. Porter is a short add-on from the col.",
  know="Roadside parking on Route 73 at Cascade Pass; shuttles run on peak weekends. Above treeline: wind layers and water. Not a small-children hike.",
  themes=["crowded","parking fills","muddy","first 46er"], src=[AT+"cascade-mountain--2","https://www.tripadvisor.com/Attraction_Review-g28953-d7363424-Reviews-Cascade_Mountain-New_York.html"]),
"jay-mountain-first-summit": dict(rating=4.7, n="1,700+", miles=4.6, climbFt=1900, duration="4–5 hours",
  review="A steady switchbacked climb through shade to an open rocky spine that reviewers on the Adirondack forums call an under-appreciated wonder: a 'highway in the sky' of bare ridge with 360-degree views toward Whiteface and the High Peaks, wild blueberries in August, and far fewer people than Route 73. The first summit makes a satisfying half-day; the full ridge to the eastern peak is eight miles and adds navigation over cairned rock. Wind and weather change fast up there, so pack a shell.",
  know="Trailhead on Upland Road (Jay Mountain Road) out of Upper Jay. Ridge is exposed and sparsely marked beyond the first summit; carry a map and GPS. No water on route.",
  themes=["open ridge","blueberries","navigation","exposed"], src=[AT+"jay-mountain-trail","https://www.adkforum.com/forum/the-adirondack-forum/hiking-in-the-adirondacks/21444-jay-mountain-ridge-trail-%E2%80%93-under-appreciated-wonder"]),
"giant-mountain-ridge-zander-scott-trail": dict(rating=4.7, n="4,100+", miles=5.4, climbFt=3050, duration="5–7 hours",
  review="The most direct way up a High Peak: the Ridge (Zander Scott) Trail climbs 3,050 feet in a little over three miles, with a lookout over Chapel Pond at 0.7 miles, the Giant's Washbowl pond just beyond, then long stretches of open rock slab with the Great Range across the valley. Reviewers describe it as relentless from the first step, exposed and spectacular, and usually busy. For fit hikers with good footwear and a whole day; not one for wet rock or thunderstorms.",
  know="Trailhead on Route 73 at Chapel Pond; roadside parking fills early. Open slab is dangerous when wet or icy. Rocky Peak Ridge is a serious add-on.",
  themes=["steep","open rock","exposed","busy"], src=[AT+"giant-mountain-via-ridge-trail","https://www.lakeplacid.com/hiking/giant-mountain"]),
"owls-head-in-keene-weekdays-only": dict(rating=4.8, n="1,400+", miles=1.2, climbFt=460, duration="1 hour",
  review="A one-mile climb through private land to open ledges with an outsized view down the Keene valley to the Great Range; reviewers rate it among the highest in the region for effort. The catch that matters: the landowner permits access on weekdays only, and it is closed Friday through Sunday. Park on Route 73 and walk in; do not block driveways or wander off the trail. Rocky near the top, but capable school-age children manage it.",
  know="Weekdays only, strictly. Park on Route 73 and walk up Owls Head Lane. Please respect the private land that makes this hike possible.",
  themes=["weekdays only","private land","big view","short"], src=[AT+"owls-head-trail","https://www.townofkeeneny.com/hiking-information/"]),
"hurricane-mountain-from-route-9n": dict(rating=4.7, n="3,100+", miles=6.5, climbFt=2000, duration="4–5.5 hours",
  review="A restored fire tower on a huge bald summit with a 360-degree view from the High Peaks to Lake Champlain and Vermont. The southern approach from the height of land on Route 9N starts gently, then climbs steadily on a well-marked trail with a little easy bouldering near the top that reviewers say novices handle fine. Steep, rocky and muddy in places, so wear real boots; the tower is open to climb.",
  know="Free trailhead on Route 9N between Keene and Elizabethtown. Tower stairs need supervision with children. Exposed summit: layers.",
  themes=["fire tower","360 view","steady climb","rocky"], src=[AT+"hurricane-mountain-trail-southern-approach","https://www.hurricanefiretower.org/hiking/"]),
"ampersand-mountain": dict(rating=4.8, n="4,700+", miles=5.4, climbFt=1811, duration="3.5–5 hours",
  review="One of the highest-rated hikes in the Saranac Lake area for a reason: a gentle first half through old forest, then a relentless, rocky, stair-and-scramble climb to a bald summit with a full circle of lakes and High Peaks. Reviewers call the top third hard but fair, and suggest an early start, plenty of water and a dog that is genuinely fit. A Saranac Lake 6er.",
  know="Trailhead on Route 3 west of Saranac Lake, opposite Middle Saranac Lake; roadside lot fills on weekends. Boulder scrambles near the top.",
  themes=["steep top third","bald summit","early start","dogs if fit"], src=[AT+"ampersand-mountain-trail","https://www.saranaclake.com/hiking/ampersand-mountain"]),
"poke-o-moonshine-fire-tower": dict(rating=4.6, n="1,300+", miles=5.1, climbFt=1280, duration="3–3.5 hours",
  review="A restored fire tower above the Champlain Valley with views to Vermont's Green Mountains and back to Whiteface, on a peak famous with climbers for its cliffs. The Observers Path is the longer, gentler way up, past a beaver pond and the old observer's cabin before joining the steeper Ranger Trail for the last quarter mile. Reviewers like the easy parking and maintained trail and mention wet spots, bugs and a few faint stretches, so download the map.",
  know="Trailhead on Route 9 (Northway exit 33), about 40 minutes. Parking fee at the former campground. Ranger Trail is the short, steep alternative (about 2.4 miles).",
  themes=["fire tower","Champlain views","gentler route","map"], src=[AT+"poke-o-moonshine-observers-path",AT+"poke-o-moonshine-trail"]),
"silver-lake-mountain": dict(rating=4.7, n="1,150+", miles=1.7, climbFt=892, duration="1.5–2 hours",
  review="A gem that almost nobody outside the area knows: under a mile of steady climbing to open ledges over Silver Lake, Taylor Pond and Catamount with Whiteface behind, rated almost as highly as Cobble Lookout by the eleven hundred people who have logged it. Reviewers note the consistent grade, the lack of trail markers near the top and the summer bugs. Twenty-five minutes north and rarely busy.",
  know="Trailhead on Silver Lake Road (County Route 27) north of Au Sable Forks. Sparse markers on the upper ledges: download the map. Ledges need supervision with small children.",
  themes=["hidden gem","view for effort","few markers","quiet"], src=[AT+"silver-lake-mountain-trail","https://www.protectadks.org/hike-silver-lake-mountain/"]),
"bear-den-mountain-wilmington": dict(rating=4.5, n="1,600+", miles=3.2, climbFt=1332, duration="2–3 hours",
  review="Short and steep, straight out of the Whiteface ski area's Bear Den lot to a rocky summit that reviewers call a great lunch spot with a straight-on view of Whiteface and the Notch. Expect hard work for its length, a few faint sections where people miss the turn, and ordinary Adirondack roots and mud. Loops over Flume Knob and back down the Flume trails are popular for a longer day.",
  know="Park at the Bear Den lot at Whiteface (NY-86). Download the map; the upper trail is lightly marked. Good boots.",
  themes=["short and steep","lunch spot","lightly marked"], src=[AT+"bear-den",AT+"bear-den-via-flume-loop"]),
"catamount-mountain": dict(rating=4.7, n="1,800+", miles=3.6, climbFt=1550, duration="3–4 hours",
  review="Short mileage, big character: the last 0.8 miles are mostly bare rock with sustained scrambling, including a narrow rock chimney at 1.4 miles that Adirondack Explorer calls high-peak scrambling on a low peak. The reward is one of the best views of Whiteface and Esther in the whole region from an isolated bald summit. Reviewers find the chimney and the boulder pitches above it intimidating in places, and the route sparsely marked, so this is for confident adults and older kids on a dry day, not for small children or nervous dogs.",
  know="Trailhead on Forestdale Road, Black Brook. Avoid in rain or ice. Download the map. Some dogs cannot manage the chimney.",
  themes=["chimney scramble","bare rock","dry days only","Whiteface view"], src=[AT+"catamount-mountain-trail","https://www.adirondackexplorer.org/outdoor-recreation/catamount-mountain-hike/"]),
"flume-knob": dict(rating=4.6, n="600+", miles=3.1, climbFt=1210, duration="2–2.5 hours",
  review="From the Flume trailhead on NY-86, a steady uphill that gets steep and scrambly right below the knob, then a ledge with Whiteface across the valley that locals treat as their after-work hike. Reviewers praise the view and the fun rock finish, and warn that signage at the junctions with the mountain-bike trails is confusing; keep the map open. Best April to October.",
  know="Flume trailhead lot on NY-86 south of the village (shared with mountain bikers). Watch the junction signs. Short rock scramble at the top.",
  themes=["after-work hike","rock scramble","confusing junctions"], src=[AT+"flume-knob",AT+"flume-knob-and-bear-den-via-flume-trail"]),
"baxter-mountain": dict(rating=4.7, n="2,600+", miles=2.7, climbFt=770, duration="1.5–2.5 hours",
  review="The easy classic of the Keene area, and the trail regional guides recommend first for families and new hikers: gentle switchbacks for the first half, then granite slabs to open ledges with the Great Range laid out to the south. Reviewers report five-year-olds making the top happily, wild blueberries in August and a busy trailhead on fine weekends. Leashed dogs welcome. Baxter Mountain Tavern sits at the bottom.",
  know="Trailhead on Route 9N at Spruce Hill between Keene and Elizabethtown; the lot is small and overflows onto the shoulder. Slabs are slippery when wet.",
  themes=["family first hike","blueberries","Great Range view","busy"], src=[AT+"baxter-mountain","https://pureadirondacks.com/blogs/adirondack-hiking/baxter-mountain"]),
"roaring-brook-falls": dict(rating=4.6, n="840+", miles=1.6, climbFt=439, duration="45–90 minutes",
  review="Ten minutes on a flat path from Route 73 brings you to the base of a 300-foot cascade; a steeper spur climbs to the top of the falls and a lookout over the Keene valley. Reviewers call it the quickest big payoff in the High Peaks and a fine leg-stretcher with children on the way to or from Keene Valley. The upper viewpoint is an unguarded cliff edge: keep everyone well back.",
  know="Trailhead lot on Route 73 at the Giant Mountain Roaring Brook trailhead. Lower path is easy; the upper spur is steep and slippery. Cliff edge at the top.",
  themes=["waterfall","quick payoff","cliff edge","kids"], src=[AT+"roaring-brook-falls-upper-and-lower-lookout","https://www.tripadvisor.com/Attraction_Review-g47987-d2198329-Reviews-Roaring_Brook_Falls-Keene_Valley_New_York.html"]),
"rooster-comb": dict(rating=4.7, n="1,600+", miles=4.5, climbFt=1729, duration="3.5–4.5 hours",
  review="From the village of Keene Valley, a steady, well-marked climb past a beaver pond to a rocky summit and a ledge looking straight down the Ausable valley with Giant and the Great Range around you. Reviewers rate it highly for the view and the maintained trail, note a false summit and a rocky, muddy final stretch, and recommend an early start and good traction. Snow Mountain can be added for a longer loop.",
  know="Trailhead lot on Route 73 at the south end of Keene Valley. Rocky top; steady but real climbing. Muddy after rain.",
  themes=["village trailhead","false summit","valley view","rocky top"], src=[AT+"rooster-comb-trail--2",AT+"rooster-comb-and-snow-mountain-loop-trail"]),
"pitchoff-balanced-rocks": dict(rating=4.7, n="1,100+", miles=3.0, climbFt=1100, duration="2.5–3.5 hours",
  review="Across the road from Cascade's trailhead, a steep set of stairs leads into a worn but lightly marked trail up to the Balanced Rocks: giant boulders on a cliff-top ledge looking down on the Cascade Lakes and across to Cascade and Porter. Reviewers call it one of the most underrated views in the High Peaks and an excellent effort-to-view ratio, with the usual warnings about steep pitches, few markers and busy weekends. Leashed dogs allowed.",
  know="Park in the Cascade Pass lots on Route 73; the trail starts on the opposite side of the road. Download the map. Big drop-offs at the ledge.",
  themes=["underrated view","steep start","few markers","cliff ledge"], src=[AT+"pitchoff-mountain-and-balancing-rocks-via-pitchoff-and-cascade-trailhead","https://www.allierambles.com/balanced-rocks-and-pitchoff-mountain-trail/"]),
"indian-head-rainbow-falls-amr": dict(rating=4.8, n="5,500+", miles=11, climbFt=1500, duration="6–8 hours",
  review="Possibly the most photographed view in the Adirondacks: Lower Ausable Lake from the cliff of Indian Head, with Rainbow Falls on the way and Fish Hawk Cliffs next door. Reviewers love that it is long but mostly gentle, with little scrambling, and warn that the loop with the falls runs closer to 14 miles than the 10 or 11 often quoted. Two rules are absolute: a free advance parking reservation with the Adirondack Mountain Reserve from May through October, and no dogs.",
  know="Reserve at hikeamr.org; park at the AMR lot in St. Huberts and walk the private Lake Road. No dogs, no exceptions. Long day: start by 8 am.",
  themes=["iconic view","reservation required","no dogs","long but gentle"], src=[AT+"indian-head-and-rainbow-falls","https://hikeamr.org/","https://theadventuresatlas.com/indian-head-hike-adirondacks/"]),
"haystack-mountain-saranac": dict(rating=4.4, n="small sample", miles=6.6, climbFt=1466, duration="3.5–4.5 hours",
  review="A Saranac Lake 6er from Route 86 near Ray Brook: a long, gentle approach through changing forest, a stream crossing, then a short, wet, rocky scramble to a partly wooded summit with views over the Saranac lakes and toward McKenzie. Guides describe the upper footing as usually wet and slippery, and the rewards as solitude and a summit you will likely have to yourself.",
  know="Trailhead on NY-86 between Lake Placid and Saranac Lake (shared with McKenzie). Wet, slick rock near the top; poles help.",
  themes=["quiet","wet footing","6er"], src=["https://www.hikingproject.com/trail/7039878/haystack-mountain-trail-blue",AT+"haystack-mountain-trail-saranac-lake"]),
"mount-marcy-via-van-hoevenberg": dict(rating=4.8, n="5,400+", miles=14.8, climbFt=3200, duration="9–11 hours",
  review="New York's highest point by its shortest and busiest route: 7.4 miles each way from Heart Lake past Marcy Dam and Indian Falls to an alpine summit where the wind and cold surprise people every summer. Reviewers say the day is varied enough that it never drags, and are unanimous on the essentials: start at dawn, expect mud, rock scrambles and steep steps, carry layers and a filter, and download the map because the upper trail is not obvious in cloud. Fit adults only.",
  know="Adirondak Loj, Heart Lake (paid parking, fills before 7 am). Alpine zone: stay on rock, off the vegetation. Turn back in thunderstorms.",
  themes=["highest point","dawn start","alpine weather","long day"], src=[AT+"mount-marcy-via-van-hoevenberg-trail--5","https://en.wikipedia.org/wiki/Van_Hoevenberg_Trail"]),
}

n = 0
for id_, r in R.items():
    p = by.get(id_)
    if not p: print("missing", id_); continue
    p["review"] = r["review"]; p["knowBefore"] = r["know"]
    p["miles"] = r["miles"]; p["climbFt"] = r["climbFt"]; p["duration"] = r["duration"]
    sig = p.setdefault("signals", {}); sig.update({"alltrailsRating": r["rating"], "alltrailsReviews": r["n"], "asOf": ASOF})
    p["research"] = {"date": ASOF, "method": "web-search read of AllTrails trail pages, regional guides, Tripadvisor and ADK forums (no scraping)", "themes": r["themes"], "sources": r["src"]}
    if not p["verification"].get("lastVerified") or p["verification"].get("status") != "verified":
        p["verification"].update({"lastVerified": ASOF, "verifiedBy": "Claude (web research)", "method": "AllTrails + regional guides", "nextReview": "2026-10-10", "status": "verified"})
    n += 1
d["meta"]["sources"]["[AT]"] = "AllTrails trail pages and community reviews, read via web search on 2026-09-10 (ratings, counts and distances as published that day; not scraped)"
json.dump(d, open(P, "w"), indent=1, ensure_ascii=False); print("enriched", n, "hikes")
