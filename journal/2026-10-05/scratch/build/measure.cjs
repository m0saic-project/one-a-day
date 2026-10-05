const {measureText,resolveFontFile}=require('@m0saic/template-utils');
const bold=resolveFontFile({weight:'bold'})?.path;
const w=(t,px,b)=>measureText(t,{fontSize:px,...(b&&bold?{fontPath:bold}:{})}).width;
const rows=`Paper Lanterns | Night Bus Home | Tidewater | 2
Glass Orchard | Slow Weather | Half Moon Recordings | 1
The Marigolds | Kitchen Radio | Fern & Flint | 5
Delta Kiosk | Parking Lot Hymns | Low Tide | 4
Nora Vance | "Blue Receipt" [Single] | Self-Released | NEW
Static Bloom | Greenhouse | Tidewater | 3
Hollow Pines | A Field Guide to Leaving Early Without Saying Goodbye | Brass Key | 12
Juno Park | Soft Machines [EP] | Night Shift | 6
Cardigan Sea | Postcards | Half Moon Recordings | 9
Vera & the Lowlights | Last Call | Brass Key | 15
Mothwing | Porchlight | Fern & Flint | 8
Tall Grass Choir | Everything Is Fine Here | Low Tide | NEW
Okapi | Signal Hill | Night Shift | 7
Rosa Calloway | Late Bloomer | Tidewater | 10
Sunday Arcade | High Score [EP] | Self-Released | 22`.split('\n').map(l=>l.split('|').map(s=>s.trim()));
// widths per 1px of font (em)
for(const r of rows) console.log(r[0].padEnd(22), (w(r[0],100,true)/100).toFixed(2), r[1].slice(0,30).padEnd(30),(w(r[1],100)/100).toFixed(2), r[2].padEnd(22),(w(r[2],100)/100).toFixed(2), 'T+L', ((w(r[1],100)+w(r[2],100))/100).toFixed(2));
const t80='The Night We Drove the Long Way Home Past Every Radio Tower in the County, Twice';
const a60='The Extremely Long Named Orchestra of Upper Tidewater County';
console.log(t80.length, (w(t80,100)/100).toFixed(2), a60.length,(w(a60,100,true)/100).toFixed(2));
console.log('30',w('30',100,true)/100,'NEW',w('NEW',100,true)/100,'+12',w('+12',100,true)/100, 'TOP 30', w('TOP 30',100,true)/100, 'KOAD 91.6 FM', w('KOAD 91.6 FM',100,true)/100, 'LOUD ROCK TOP 10', w('LOUD ROCK TOP 10',100,true)/100);
console.log('label40', w('Half Moon Recordings & Tapes Cooperative',100)/100, 'Half Moon Recordings & Tapes Cooperative'.length);
