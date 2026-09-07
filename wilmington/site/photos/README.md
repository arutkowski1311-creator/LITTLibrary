# Photographs

Drop one file per slot into this folder, named exactly `<slot>.jpg` (or `.png`), then run
`python3 ../build.py` to embed them. Add credits and licences in `credits.json`:

```json
{ "hero": { "credit": "Photo: Adam Rutkowski", "license": "owner" },
  "gorge": { "credit": "Photo: J. Doe / Wikimedia Commons", "license": "CC BY-SA 4.0" } }
```

| Slot | Photograph wanted | Notes |
| --- | --- | --- |
| hero | Whiteface Mountain from the Wilmington valley | Landscape, wide. The first thing anyone sees. |
| river | West Branch of the Ausable River in Wilmington | Wide, water in motion, low light works well. |
| notch | Wilmington Notch (NY-86) | Cliffs above road and river. |
| stay-H | Main house exterior | Owner photograph. 4:3 or wider. |
| stay-A | Apartment entrance | Owner photograph. |
| stay-HA | Whole property | Owner photograph showing both units. |
| H-living, H-kitchen, H-bed | Main house rooms | Owner photographs, current, no wide-angle distortion. |
| A-main, A-kitchen, A-bath | Apartment rooms | Owner photographs. |
| HA-grounds, HA-river, HA-winter | Grounds, river side, winter | Owner photographs. |
| whiteface | Whiteface summit | |
| gorge | High Falls Gorge | |
| flume | Flume Trails | |
| placid | Mirror Lake, Lake Placid | |
| jay | Jay Covered Bridge | |
| chasm | Ausable Chasm | |
| highway | Whiteface Veterans' Memorial Highway | |
| nordic | Mt Van Hoevenberg trails | |
| ponds | Copperas Pond | |
| kiln | Cooper Kiln Pond | |
| santa | Santa's Workshop | |
| refuge | Adirondack Wildlife Refuge | |
| museum | Lake Placid Olympic Museum | |
| wild | The Wild Center | |
| hardy | Hardy Road Trails | |
| winter, spring, summer, autumn | The valley in each season | Used on the Area and Seasons pages. |

Only photographs you own or hold a licence for (Wikimedia Commons CC BY / CC BY-SA / CC0,
Unsplash licence, or purchased stock). The build script records the credit line under each image
and lists all credits in the footer.
