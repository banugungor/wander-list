export type ContinentId =
  | "africa"
  | "asia"
  | "europe"
  | "north_america"
  | "south_america"
  | "oceania";

export const CONTINENTS: { id: ContinentId; name: string; nameEn: string }[] = [
  { id: "africa", name: "Afrika", nameEn: "Africa" },
  { id: "asia", name: "Asya", nameEn: "Asia" },
  { id: "europe", name: "Avrupa", nameEn: "Europe" },
  { id: "north_america", name: "Kuzey Amerika", nameEn: "North America" },
  { id: "south_america", name: "Güney Amerika", nameEn: "South America" },
  { id: "oceania", name: "Okyanusya", nameEn: "Oceania" },
];

// Keyed by worldCountries.json's `id` field (not iso2 — a couple of entries,
// e.g. Cyprus/N. Cyprus, share the same iso2 but need distinct continents).
// A handful of uninhabited sub-Antarctic territories (Fr. S. Antarctic Lands,
// Heard I. and McDonald Is., S. Geo. and the Is.) are intentionally omitted —
// there's no "antarctica" bucket in this 6-continent model.
export const CONTINENT_BY_COUNTRY_ID: Record<string, ContinentId> = {
  // Africa
  "012": "africa", // Algeria
  "024": "africa", // Angola
  "204": "africa", // Benin
  "072": "africa", // Botswana
  "854": "africa", // Burkina Faso
  "108": "africa", // Burundi
  "132": "africa", // Cabo Verde
  "120": "africa", // Cameroon
  "140": "africa", // Central African Rep.
  "148": "africa", // Chad
  "174": "africa", // Comoros
  "178": "africa", // Congo
  "384": "africa", // Côte d'Ivoire
  "180": "africa", // Dem. Rep. Congo
  "262": "africa", // Djibouti
  "818": "africa", // Egypt
  "226": "africa", // Eq. Guinea
  "232": "africa", // Eritrea
  "748": "africa", // eSwatini
  "231": "africa", // Ethiopia
  "266": "africa", // Gabon
  "270": "africa", // Gambia
  "288": "africa", // Ghana
  "324": "africa", // Guinea
  "624": "africa", // Guinea-Bissau
  "404": "africa", // Kenya
  "426": "africa", // Lesotho
  "430": "africa", // Liberia
  "434": "africa", // Libya
  "450": "africa", // Madagascar
  "454": "africa", // Malawi
  "466": "africa", // Mali
  "478": "africa", // Mauritania
  "480": "africa", // Mauritius
  "504": "africa", // Morocco
  "508": "africa", // Mozambique
  "516": "africa", // Namibia
  "562": "africa", // Niger
  "566": "africa", // Nigeria
  "646": "africa", // Rwanda
  "728": "africa", // S. Sudan
  "654": "africa", // Saint Helena
  "678": "africa", // São Tomé and Principe
  "686": "africa", // Senegal
  "690": "africa", // Seychelles
  "694": "africa", // Sierra Leone
  "706": "africa", // Somalia
  "zz-somaliland": "africa", // Somaliland
  "710": "africa", // South Africa
  "729": "africa", // Sudan
  "834": "africa", // Tanzania
  "768": "africa", // Togo
  "788": "africa", // Tunisia
  "800": "africa", // Uganda
  "732": "africa", // W. Sahara
  "894": "africa", // Zambia
  "716": "africa", // Zimbabwe

  // Asia
  "004": "asia", // Afghanistan
  "051": "asia", // Armenia
  "031": "asia", // Azerbaijan
  "048": "asia", // Bahrain
  "050": "asia", // Bangladesh
  "064": "asia", // Bhutan
  "086": "asia", // Br. Indian Ocean Ter.
  "096": "asia", // Brunei
  "116": "asia", // Cambodia
  "156": "asia", // China
  "196": "asia", // Cyprus
  "268": "asia", // Georgia
  "344": "asia", // Hong Kong
  "356": "asia", // India
  "zz-indian-ocean-ter": "asia", // Indian Ocean Ter.
  "360": "asia", // Indonesia
  "364": "asia", // Iran
  "368": "asia", // Iraq
  "376": "asia", // Israel
  "392": "asia", // Japan
  "400": "asia", // Jordan
  "398": "asia", // Kazakhstan
  "zz-kosovo": "europe", // Kosovo (kept with Europe — cultural/political convention)
  "414": "asia", // Kuwait
  "417": "asia", // Kyrgyzstan
  "418": "asia", // Laos
  "422": "asia", // Lebanon
  "446": "asia", // Macao
  "458": "asia", // Malaysia
  "462": "asia", // Maldives
  "496": "asia", // Mongolia
  "104": "asia", // Myanmar
  "zz-n-cyprus": "asia", // N. Cyprus
  "524": "asia", // Nepal
  "408": "asia", // North Korea
  "512": "asia", // Oman
  "586": "asia", // Pakistan
  "275": "asia", // Palestine
  "608": "asia", // Philippines
  "634": "asia", // Qatar
  "682": "asia", // Saudi Arabia
  "zz-siachen-glacier": "asia", // Siachen Glacier
  "702": "asia", // Singapore
  "410": "asia", // South Korea
  "144": "asia", // Sri Lanka
  "760": "asia", // Syria
  "158": "asia", // Taiwan
  "762": "asia", // Tajikistan
  "764": "asia", // Thailand
  "626": "asia", // Timor-Leste
  "792": "asia", // Turkey
  "795": "asia", // Turkmenistan
  "784": "asia", // United Arab Emirates
  "860": "asia", // Uzbekistan
  "704": "asia", // Vietnam
  "887": "asia", // Yemen

  // Europe
  "248": "europe", // Åland
  "008": "europe", // Albania
  "020": "europe", // Andorra
  "040": "europe", // Austria
  "112": "europe", // Belarus
  "056": "europe", // Belgium
  "070": "europe", // Bosnia and Herz.
  "100": "europe", // Bulgaria
  "191": "europe", // Croatia
  "203": "europe", // Czechia
  "208": "europe", // Denmark
  "233": "europe", // Estonia
  "234": "europe", // Faeroe Is.
  "246": "europe", // Finland
  "250": "europe", // France
  "276": "europe", // Germany
  "300": "europe", // Greece
  "831": "europe", // Guernsey
  "348": "europe", // Hungary
  "352": "europe", // Iceland
  "372": "europe", // Ireland
  "833": "europe", // Isle of Man
  "380": "europe", // Italy
  "832": "europe", // Jersey
  "428": "europe", // Latvia
  "438": "europe", // Liechtenstein
  "440": "europe", // Lithuania
  "442": "europe", // Luxembourg
  "807": "europe", // Macedonia
  "470": "europe", // Malta
  "498": "europe", // Moldova
  "492": "europe", // Monaco
  "499": "europe", // Montenegro
  "528": "europe", // Netherlands
  "578": "europe", // Norway
  "616": "europe", // Poland
  "620": "europe", // Portugal
  "642": "europe", // Romania
  "643": "europe", // Russia
  "674": "europe", // San Marino
  "688": "europe", // Serbia
  "703": "europe", // Slovakia
  "705": "europe", // Slovenia
  "724": "europe", // Spain
  "752": "europe", // Sweden
  "756": "europe", // Switzerland
  "804": "europe", // Ukraine
  "826": "europe", // United Kingdom
  "336": "europe", // Vatican

  // North America
  "660": "north_america", // Anguilla
  "028": "north_america", // Antigua and Barb.
  "533": "north_america", // Aruba
  "044": "north_america", // Bahamas
  "052": "north_america", // Barbados
  "084": "north_america", // Belize
  "060": "north_america", // Bermuda
  "124": "north_america", // Canada
  "136": "north_america", // Cayman Is.
  "188": "north_america", // Costa Rica
  "192": "north_america", // Cuba
  "531": "north_america", // Curaçao
  "212": "north_america", // Dominica
  "214": "north_america", // Dominican Rep.
  "222": "north_america", // El Salvador
  "304": "north_america", // Greenland
  "308": "north_america", // Grenada
  "320": "north_america", // Guatemala
  "332": "north_america", // Haiti
  "340": "north_america", // Honduras
  "388": "north_america", // Jamaica
  "484": "north_america", // Mexico
  "500": "north_america", // Montserrat
  "558": "north_america", // Nicaragua
  "591": "north_america", // Panama
  "630": "north_america", // Puerto Rico
  "662": "north_america", // Saint Lucia
  "652": "north_america", // St-Barthélemy
  "663": "north_america", // St-Martin
  "659": "north_america", // St. Kitts and Nevis
  "666": "north_america", // St. Pierre and Miquelon
  "670": "north_america", // St. Vin. and Gren.
  "534": "north_america", // Sint Maarten
  "796": "north_america", // Turks and Caicos Is.
  "780": "north_america", // Trinidad and Tobago
  "850": "north_america", // U.S. Virgin Is.
  "840": "north_america", // United States of America
  "092": "north_america", // British Virgin Is.

  // South America
  "032": "south_america", // Argentina
  "068": "south_america", // Bolivia
  "076": "south_america", // Brazil
  "152": "south_america", // Chile
  "170": "south_america", // Colombia
  "218": "south_america", // Ecuador
  "238": "south_america", // Falkland Is.
  "328": "south_america", // Guyana
  "600": "south_america", // Paraguay
  "604": "south_america", // Peru
  "740": "south_america", // Suriname
  "858": "south_america", // Uruguay
  "862": "south_america", // Venezuela

  // Oceania
  "016": "oceania", // American Samoa
  "036": "oceania", // Australia
  "184": "oceania", // Cook Is.
  "242": "oceania", // Fiji
  "258": "oceania", // Fr. Polynesia
  "316": "oceania", // Guam
  "296": "oceania", // Kiribati
  "584": "oceania", // Marshall Is.
  "583": "oceania", // Micronesia
  "540": "oceania", // New Caledonia
  "554": "oceania", // New Zealand
  "570": "oceania", // Niue
  "574": "oceania", // Norfolk Island
  "580": "oceania", // N. Mariana Is.
  "520": "oceania", // Nauru
  "585": "oceania", // Palau
  "598": "oceania", // Papua New Guinea
  "612": "oceania", // Pitcairn Is.
  "882": "oceania", // Samoa
  "090": "oceania", // Solomon Is.
  "776": "oceania", // Tonga
  "548": "oceania", // Vanuatu
  "876": "oceania", // Wallis and Futuna Is.
  "334": "oceania", // Heard I. and McDonald Is. (Australian territory)
};

export function getVisitedContinents(countryIds: string[]): Set<ContinentId> {
  const result = new Set<ContinentId>();
  for (const id of countryIds) {
    const continent = CONTINENT_BY_COUNTRY_ID[id];
    if (continent) result.add(continent);
  }
  return result;
}

export function getTotalContinentCount(): number {
  return CONTINENTS.length;
}
