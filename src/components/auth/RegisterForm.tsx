import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Calendar, Flag, FileText, Globe, Shield, UserCheck, ChevronRight, ChevronLeft, Upload, AlertCircle, MapPin, Navigation, Search, Sparkles, Wand2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { OpenLocationCode } from 'open-location-code';
import { enhanceLocationDescription, getFormAssistantTips } from '../../services/geminiService';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const countryPrefixes = [
  { code: 'AF', prefix: '+93', name: 'Afghanistan' },
  { code: 'AL', prefix: '+355', name: 'Albania' },
  { code: 'DZ', prefix: '+213', name: 'Algeria' },
  { code: 'AD', prefix: '+376', name: 'Andorra' },
  { code: 'AO', prefix: '+244', name: 'Angola' },
  { code: 'AI', prefix: '+1264', name: 'Anguilla' },
  { code: 'AG', prefix: '+1268', name: 'Antigua e Barbuda' },
  { code: 'AR', prefix: '+54', name: 'Argentina' },
  { code: 'AM', prefix: '+374', name: 'Armenia' },
  { code: 'AW', prefix: '+297', name: 'Aruba' },
  { code: 'AU', prefix: '+61', name: 'Australia' },
  { code: 'AT', prefix: '+43', name: 'Austria' },
  { code: 'AZ', prefix: '+994', name: 'Azerbaigian' },
  { code: 'BS', prefix: '+1242', name: 'Bahamas' },
  { code: 'BH', prefix: '+973', name: 'Bahrein' },
  { code: 'BD', prefix: '+880', name: 'Bangladesh' },
  { code: 'BB', prefix: '+1246', name: 'Barbados' },
  { code: 'BY', prefix: '+375', name: 'Bielorussia' },
  { code: 'BE', prefix: '+32', name: 'Belgio' },
  { code: 'BZ', prefix: '+501', name: 'Belize' },
  { code: 'BJ', prefix: '+229', name: 'Benin' },
  { code: 'BM', prefix: '+1441', name: 'Bermuda' },
  { code: 'BT', prefix: '+975', name: 'Bhutan' },
  { code: 'BO', prefix: '+591', name: 'Bolivia' },
  { code: 'BA', prefix: '+387', name: 'Bosnia ed Erzegovina' },
  { code: 'BW', prefix: '+267', name: 'Botswana' },
  { code: 'BR', prefix: '+55', name: 'Brasile' },
  { code: 'BN', prefix: '+673', name: 'Brunei' },
  { code: 'BG', prefix: '+359', name: 'Bulgaria' },
  { code: 'BF', prefix: '+226', name: 'Burkina Faso' },
  { code: 'BI', prefix: '+257', name: 'Burundi' },
  { code: 'KH', prefix: '+855', name: 'Cambogia' },
  { code: 'CM', prefix: '+237', name: 'Camerun' },
  { code: 'CA', prefix: '+1', name: 'Canada' },
  { code: 'CV', prefix: '+238', name: 'Capo Verde' },
  { code: 'KY', prefix: '+1345', name: 'Isole Cayman' },
  { code: 'CF', prefix: '+236', name: 'Repubblica Centrafricana' },
  { code: 'TD', prefix: '+235', name: 'Ciad' },
  { code: 'CL', prefix: '+56', name: 'Cile' },
  { code: 'CN', prefix: '+86', name: 'Cina' },
  { code: 'CO', prefix: '+57', name: 'Colombia' },
  { code: 'KM', prefix: '+269', name: 'Comore' },
  { code: 'CG', prefix: '+242', name: 'Congo' },
  { code: 'CK', prefix: '+682', name: 'Isole Cook' },
  { code: 'CR', prefix: '+506', name: 'Costa Rica' },
  { code: 'HR', prefix: '+385', name: 'Croazia' },
  { code: 'CU', prefix: '+53', name: 'Cuba' },
  { code: 'CY', prefix: '+357', name: 'Cipro' },
  { code: 'CZ', prefix: '+420', name: 'Repubblica Ceca' },
  { code: 'DK', prefix: '+45', name: 'Danimarca' },
  { code: 'DJ', prefix: '+253', name: 'Gibuti' },
  { code: 'DM', prefix: '+1767', name: 'Dominica' },
  { code: 'DO', prefix: '+1809', name: 'Repubblica Dominicana' },
  { code: 'EC', prefix: '+593', name: 'Ecuador' },
  { code: 'EG', prefix: '+20', name: 'Egitto' },
  { code: 'SV', prefix: '+503', name: 'El Salvador' },
  { code: 'GQ', prefix: '+240', name: 'Guinea Equatoriale' },
  { code: 'ER', prefix: '+291', name: 'Eritrea' },
  { code: 'EE', prefix: '+372', name: 'Estonia' },
  { code: 'ET', prefix: '+251', name: 'Etiopia' },
  { code: 'FK', prefix: '+500', name: 'Isole Falkland' },
  { code: 'FO', prefix: '+298', name: 'Isole Faroe' },
  { code: 'FJ', prefix: '+679', name: 'Figi' },
  { code: 'FI', prefix: '+358', name: 'Finlandia' },
  { code: 'FR', prefix: '+33', name: 'Francia' },
  { code: 'GF', prefix: '+594', name: 'Guyana Francese' },
  { code: 'PF', prefix: '+689', name: 'Polinesia Francese' },
  { code: 'GA', prefix: '+241', name: 'Gabon' },
  { code: 'GM', prefix: '+220', name: 'Gambia' },
  { code: 'GE', prefix: '+995', name: 'Georgia' },
  { code: 'DE', prefix: '+49', name: 'Germania' },
  { code: 'GH', prefix: '+233', name: 'Ghana' },
  { code: 'GI', prefix: '+350', name: 'Gibilterra' },
  { code: 'GR', prefix: '+30', name: 'Grecia' },
  { code: 'GL', prefix: '+299', name: 'Groenlandia' },
  { code: 'GD', prefix: '+1473', name: 'Grenada' },
  { code: 'GP', prefix: '+590', name: 'Guadalupa' },
  { code: 'GU', prefix: '+1671', name: 'Guam' },
  { code: 'GT', prefix: '+502', name: 'Guatemala' },
  { code: 'GN', prefix: '+224', name: 'Guinea' },
  { code: 'GW', prefix: '+245', name: 'Guinea-Bissau' },
  { code: 'GY', prefix: '+592', name: 'Guyana' },
  { code: 'HT', prefix: '+509', name: 'Haiti' },
  { code: 'VA', prefix: '+379', name: 'Vaticano' },
  { code: 'HN', prefix: '+504', name: 'Honduras' },
  { code: 'HK', prefix: '+852', name: 'Hong Kong' },
  { code: 'HU', prefix: '+36', name: 'Ungheria' },
  { code: 'IS', prefix: '+354', name: 'Islanda' },
  { code: 'IN', prefix: '+91', name: 'India' },
  { code: 'ID', prefix: '+62', name: 'Indonesia' },
  { code: 'IR', prefix: '+98', name: 'Iran' },
  { code: 'IQ', prefix: '+964', name: 'Iraq' },
  { code: 'IE', prefix: '+353', name: 'Irlanda' },
  { code: 'IL', prefix: '+972', name: 'Israele' },
  { code: 'IT', prefix: '+39', name: 'Italia' },
  { code: 'JM', prefix: '+1876', name: 'Giamaica' },
  { code: 'JP', prefix: '+81', name: 'Giappone' },
  { code: 'JO', prefix: '+962', name: 'Giordania' },
  { code: 'KZ', prefix: '+7', name: 'Kazakistan' },
  { code: 'KE', prefix: '+254', name: 'Kenya' },
  { code: 'KI', prefix: '+686', name: 'Kiribati' },
  { code: 'KP', prefix: '+850', name: 'Corea del Nord' },
  { code: 'KR', prefix: '+82', name: 'Corea del Sud' },
  { code: 'KW', prefix: '+965', name: 'Kuwait' },
  { code: 'KG', prefix: '+996', name: 'Kirghizistan' },
  { code: 'LA', prefix: '+856', name: 'Laos' },
  { code: 'LV', prefix: '+371', name: 'Lettonia' },
  { code: 'LB', prefix: '+961', name: 'Libano' },
  { code: 'LS', prefix: '+266', name: 'Lesotho' },
  { code: 'LR', prefix: '+231', name: 'Liberia' },
  { code: 'LY', prefix: '+218', name: 'Libia' },
  { code: 'LI', prefix: '+423', name: 'Liechtenstein' },
  { code: 'LT', prefix: '+370', name: 'Lituania' },
  { code: 'LU', prefix: '+352', name: 'Lussemburgo' },
  { code: 'MO', prefix: '+853', name: 'Macao' },
  { code: 'MK', prefix: '+389', name: 'Macedonia' },
  { code: 'MG', prefix: '+261', name: 'Madagascar' },
  { code: 'MW', prefix: '+265', name: 'Malawi' },
  { code: 'MY', prefix: '+60', name: 'Malesia' },
  { code: 'MV', prefix: '+960', name: 'Maldive' },
  { code: 'ML', prefix: '+223', name: 'Mali' },
  { code: 'MT', prefix: '+356', name: 'Malta' },
  { code: 'MH', prefix: '+692', name: 'Isole Marshall' },
  { code: 'MQ', prefix: '+596', name: 'Martinica' },
  { code: 'MR', prefix: '+222', name: 'Mauritania' },
  { code: 'MU', prefix: '+230', name: 'Mauritius' },
  { code: 'YT', prefix: '+262', name: 'Mayotte' },
  { code: 'MX', prefix: '+52', name: 'Messico' },
  { code: 'FM', prefix: '+691', name: 'Micronesia' },
  { code: 'MD', prefix: '+373', name: 'Moldavia' },
  { code: 'MC', prefix: '+377', name: 'Monaco' },
  { code: 'MN', prefix: '+976', name: 'Mongolia' },
  { code: 'MS', prefix: '+1664', name: 'Montserrat' },
  { code: 'MA', prefix: '+212', name: 'Marocco' },
  { code: 'MZ', prefix: '+258', name: 'Mozambico' },
  { code: 'MM', prefix: '+95', name: 'Myanmar' },
  { code: 'NA', prefix: '+264', name: 'Namibia' },
  { code: 'NR', prefix: '+674', name: 'Nauru' },
  { code: 'NP', prefix: '+977', name: 'Nepal' },
  { code: 'NL', prefix: '+31', name: 'Paesi Bassi' },
  { code: 'NC', prefix: '+687', name: 'Nuova Caledonia' },
  { code: 'NZ', prefix: '+64', name: 'Nuova Zelanda' },
  { code: 'NI', prefix: '+505', name: 'Nicaragua' },
  { code: 'NE', prefix: '+227', name: 'Niger' },
  { code: 'NG', prefix: '+234', name: 'Nigeria' },
  { code: 'NU', prefix: '+683', name: 'Niue' },
  { code: 'NF', prefix: '+672', name: 'Isola Norfolk' },
  { code: 'MP', prefix: '+1670', name: 'Isole Marianne Settentrionali' },
  { code: 'NO', prefix: '+47', name: 'Norvegia' },
  { code: 'OM', prefix: '+968', name: 'Oman' },
  { code: 'PK', prefix: '+92', name: 'Pakistan' },
  { code: 'PW', prefix: '+680', name: 'Palau' },
  { code: 'PA', prefix: '+507', name: 'Panama' },
  { code: 'PG', prefix: '+675', name: 'Papua Nuova Guinea' },
  { code: 'PY', prefix: '+595', name: 'Paraguay' },
  { code: 'PE', prefix: '+51', name: 'Perù' },
  { code: 'PH', prefix: '+63', name: 'Filippine' },
  { code: 'PL', prefix: '+48', name: 'Polonia' },
  { code: 'PT', prefix: '+351', name: 'Portogallo' },
  { code: 'PR', prefix: '+1787', name: 'Porto Rico' },
  { code: 'QA', prefix: '+974', name: 'Qatar' },
  { code: 'RE', prefix: '+262', name: 'Réunion' },
  { code: 'RO', prefix: '+40', name: 'Romania' },
  { code: 'RU', prefix: '+7', name: 'Russia' },
  { code: 'RW', prefix: '+250', name: 'Ruanda' },
  { code: 'KN', prefix: '+1869', name: 'Saint Kitts e Nevis' },
  { code: 'LC', prefix: '+1758', name: 'Santa Lucia' },
  { code: 'VC', prefix: '+1784', name: 'Saint Vincent e Grenadine' },
  { code: 'WS', prefix: '+685', name: 'Samoa' },
  { code: 'SM', prefix: '+378', name: 'San Marino' },
  { code: 'ST', prefix: '+239', name: 'São Tomé e Príncipe' },
  { code: 'SA', prefix: '+966', name: 'Arabia Saudita' },
  { code: 'SN', prefix: '+221', name: 'Senegal' },
  { code: 'RS', prefix: '+381', name: 'Serbia' },
  { code: 'SC', prefix: '+248', name: 'Seychelles' },
  { code: 'SL', prefix: '+232', name: 'Sierra Leone' },
  { code: 'SG', prefix: '+65', name: 'Singapore' },
  { code: 'SK', prefix: '+421', name: 'Slovacchia' },
  { code: 'SI', prefix: '+386', name: 'Slovenia' },
  { code: 'SB', prefix: '+677', name: 'Isole Salomone' },
  { code: 'SO', prefix: '+252', name: 'Somalia' },
  { code: 'ZA', prefix: '+27', name: 'Sudafrica' },
  { code: 'ES', prefix: '+34', name: 'Spagna' },
  { code: 'LK', prefix: '+94', name: 'Sri Lanka' },
  { code: 'SD', prefix: '+249', name: 'Sudan' },
  { code: 'SR', prefix: '+597', name: 'Suriname' },
  { code: 'SZ', prefix: '+268', name: 'Swaziland' },
  { code: 'SE', prefix: '+46', name: 'Svezia' },
  { code: 'CH', prefix: '+41', name: 'Svizzera' },
  { code: 'SY', prefix: '+963', name: 'Siria' },
  { code: 'TW', prefix: '+886', name: 'Taiwan' },
  { code: 'TJ', prefix: '+992', name: 'Tagikistan' },
  { code: 'TZ', prefix: '+255', name: 'Tanzania' },
  { code: 'TH', prefix: '+66', name: 'Thailandia' },
  { code: 'TG', prefix: '+228', name: 'Togo' },
  { code: 'TK', prefix: '+690', name: 'Tokelau' },
  { code: 'TO', prefix: '+676', name: 'Tonga' },
  { code: 'TT', prefix: '+1868', name: 'Trinidad e Tobago' },
  { code: 'TN', prefix: '+216', name: 'Tunisia' },
  { code: 'TR', prefix: '+90', name: 'Turchia' },
  { code: 'TM', prefix: '+993', name: 'Turkmenistan' },
  { code: 'TV', prefix: '+688', name: 'Tuvalu' },
  { code: 'UG', prefix: '+256', name: 'Uganda' },
  { code: 'UA', prefix: '+380', name: 'Ucraina' },
  { code: 'AE', prefix: '+971', name: 'Emirati Arabi Uniti' },
  { code: 'UK', prefix: '+44', name: 'Regno Unito' },
  { code: 'US', prefix: '+1', name: 'Stati Uniti' },
  { code: 'UY', prefix: '+598', name: 'Uruguay' },
  { code: 'UZ', prefix: '+998', name: 'Uzbekistan' },
  { code: 'VU', prefix: '+678', name: 'Vanuatu' },
  { code: 'VE', prefix: '+58', name: 'Venezuela' },
  { code: 'VN', prefix: '+84', name: 'Vietnam' },
  { code: 'YE', prefix: '+967', name: 'Yemen' },
  { code: 'ZM', prefix: '+260', name: 'Zambia' },
  { code: 'ZW', prefix: '+263', name: 'Zimbabwe' }
].sort((a, b) => a.name.localeCompare(b.name));

function LocationMarker({ onPositionChange, position }: { onPositionChange: (pos: [number, number]) => void, position: [number, number] | null }) {
  const map = useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange([pos.lat, pos.lng]);
        }
      }}
    />
  );
}

export default function RegisterForm() {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    surname: '',
    firstName: '',
    gender: 'M',
    birthDate: '',
    birthPlace: '',
    birthCountry: '',
    citizenship: '',
    maritalStatus: 'Single',
    residenceAddress: '',
    residenceNumber: '',
    residenceZip: '',
    residenceCity: '',
    residenceProvince: '',
    residenceCountry: '',
    registrationDate: '',
    plusCode: '',
    locationDescription: '',
    latitude: null as number | null,
    longitude: null as number | null,
    email: '',
    phonePrefix: '+39',
    phoneNumber: '',
    username: '',
    password: '',
    documentType: 'ID_CARD',
    documentFront: null as File | null,
    documentBack: null as File | null,
    documentHash: '',
    isAmbassador: false,
    isPeacekeeper: false,
  });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [birthPlaceSuggestions, setBirthPlaceSuggestions] = useState<any[]>([]);
  const [birthCountrySuggestions, setBirthCountrySuggestions] = useState<any[]>([]);
  const [citizenshipSuggestions, setCitizenshipSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [emailSelection, setEmailSelection] = useState<boolean | null>(null);
  const [phoneSelection, setPhoneSelection] = useState<boolean | null>(null);
  const [prefixSearch, setPrefixSearch] = useState('');
  const [showPrefixSuggestions, setShowPrefixSuggestions] = useState(false);
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [previews, setPreviews] = useState<{ front: string | null, back: string | null }>({ front: null, back: null });
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  useEffect(() => {
    // Attempt to detect country prefix via geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`);
          const data = await res.json();
          if (data.address && data.address.country_code) {
            const countryCode = data.address.country_code.toUpperCase();
            const match = countryPrefixes.find(p => p.code === countryCode);
            if (match) {
              setFormData(prev => ({ ...prev, phonePrefix: match.prefix }));
            }
          }
        } catch (err) {
          console.error("Error detecting country prefix:", err);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (step === 3) {
      window.scrollTo(0, 0);
      // Attempt to get location silently to bias address search if not already set
      if (!formData.latitude && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setFormData(prev => ({
              ...prev,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            }));
          },
          () => {/* ignore errors for silent biasing */},
          { timeout: 5000 }
        );
      }
    }
  }, [step, formData.latitude]);

  const searchLocation = async (query: string, type: 'address' | 'birthPlace' | 'birthCountry' | 'citizenship') => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      if (type === 'address') setAddressSuggestions([]);
      if (type === 'birthPlace') setBirthPlaceSuggestions([]);
      if (type === 'birthCountry') setBirthCountrySuggestions([]);
      if (type === 'citizenship') setCitizenshipSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const API_BASE = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev';
        let url = `${API_BASE}/api/lookup/location?q=${encodeURIComponent(query)}`;
        
        if (type === 'birthCountry' || type === 'citizenship') url += '&type=country';
        if (type === 'birthPlace') url += '&type=city';
        
        // Add current location if available to bias search results
        if (formData.latitude && formData.longitude) {
          url += `&lat=${formData.latitude}&lon=${formData.longitude}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          // If the proxy returns an error (403, 429), we just clear suggestions
          // and stop searching without throwing an error that might be disruptive
          if (type === 'address') setAddressSuggestions([]);
          if (type === 'birthPlace') setBirthPlaceSuggestions([]);
          if (type === 'birthCountry') setBirthCountrySuggestions([]);
          if (type === 'citizenship') setCitizenshipSuggestions([]);
          setIsSearching(false);
          return;
        }
        const data = await response.json();
        
        if (Array.isArray(data)) {
          if (type === 'address') setAddressSuggestions(data);
          if (type === 'birthPlace') setBirthPlaceSuggestions(data);
          if (type === 'birthCountry') setBirthCountrySuggestions(data);
          if (type === 'citizenship') setCitizenshipSuggestions(data);
        } else {
          // Clear suggestions if response is not an array
          if (type === 'address') setAddressSuggestions([]);
          if (type === 'birthPlace') setBirthPlaceSuggestions([]);
          if (type === 'birthCountry') setBirthCountrySuggestions([]);
          if (type === 'citizenship') setCitizenshipSuggestions([]);
        }
      } catch (err) {
        console.error(`Error fetching ${type} suggestions:`, err);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce
  };

  const selectBirthLocation = (suggestion: any, type: 'birthPlace' | 'birthCountry') => {
    if (type === 'birthPlace') {
      const city = suggestion.address.city || suggestion.address.town || suggestion.address.village || suggestion.display_name.split(',')[0];
      const country = suggestion.address.country || suggestion.display_name.split(',').pop()?.trim();
      setFormData(prev => ({ 
        ...prev, 
        birthPlace: city.toUpperCase(),
        birthCountry: (country || prev.birthCountry).toUpperCase()
      }));
      setBirthPlaceSuggestions([]);
    } else {
      const country = suggestion.address.country || suggestion.display_name.split(',').pop()?.trim();
      setFormData(prev => ({ ...prev, birthCountry: country.toUpperCase() }));
      setBirthCountrySuggestions([]);
    }
  };

  const selectCitizenship = (suggestion: any) => {
    const country = suggestion.address.country || suggestion.display_name.split(',').pop()?.trim();
    setFormData(prev => ({ ...prev, citizenship: country.toUpperCase() }));
    setCitizenshipSuggestions([]);
  };

  const selectAddress = (suggestion: any) => {
    const { address, lat, lon } = suggestion;
    const street = address.road || '';
    const houseNumber = address.house_number || '';
    const city = address.city || address.town || address.village || '';
    const zip = address.postcode || '';
    const province = address.province || address.county || '';
    const country = address.country || '';

    const olc = new OpenLocationCode();
    const plusCode = olc.encode(parseFloat(lat), parseFloat(lon));

    setFormData(prev => ({
      ...prev,
      residenceAddress: street.toUpperCase(),
      residenceNumber: houseNumber.toUpperCase(),
      residenceCity: city.toUpperCase(),
      residenceZip: zip.toUpperCase(),
      residenceProvince: province.slice(0, 2).toUpperCase(),
      residenceCountry: country.toUpperCase(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      plusCode
    }));
    setAddressSuggestions([]);
    setIsVerifyingAddress(true);
  };

  const [isManualDateEntry, setIsManualDateEntry] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    const fetchTip = async () => {
      const tip = await getFormAssistantTips(step, formData);
      setAiTip(tip);
    };
    fetchTip();
  }, [step]);

  useEffect(() => {
    if (formData.birthDate && !isManualDateEntry) {
      const [y, m, d] = formData.birthDate.split('-');
      if (y && m && d) setManualDate(`${d}/${m}/${y}`);
    }
  }, [formData.birthDate, isManualDateEntry]);

  const handleManualDateChange = (val: string) => {
    // Remove non-numeric
    const clean = val.replace(/\D/g, '').slice(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 4) formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
    
    setManualDate(formatted);
    
    // If we have 8 digits, try to extract parts and update birthDate (YYYY-MM-DD)
    if (clean.length === 8) {
      const day = clean.slice(0, 2);
      const month = clean.slice(2, 4);
      const year = clean.slice(4, 8);
      const isoDate = `${year}-${month}-${day}`;
      
      // Simple date validation
      const d = parseInt(day, 10);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 1900 && y < 2100) {
        setFormData(prev => ({ ...prev, birthDate: isoDate }));
      }
    }
  };

  const validateStep = (currentStep: number) => {
    setError(null);
    switch (currentStep) {
      case 1:
        if (!formData.surname || !formData.firstName || !formData.birthDate || !formData.birthPlace || !formData.birthCountry) {
          setError('Tutti i campi dell\'Identità Individuale sono obbligatori.');
          return false;
        }
        return true;
      case 2:
        if (!formData.citizenship) {
          setError('Indica la tua cittadinanza attuale.');
          return false;
        }
        return true;
      case 3:
        const hasSomeLocation = formData.residenceAddress || 
                                formData.plusCode || 
                                formData.residenceCity || 
                                formData.residenceZip || 
                                (formData.latitude && formData.longitude);
        if (!hasSomeLocation) {
          setError('Devi fornire almeno un dato sulla tua localizzazione (Indirizzo, Plus Code o Posizione Mappa).');
          return false;
        }
        
        // Extended validation for address details
        if (formData.residenceAddress) {
          if (!formData.residenceCity) {
            setError('Indirizzo rilevato, ma manca il Comune di residenza.');
            return false;
          }
          if (!formData.residenceZip) {
            setError('Indirizzo rilevato, ma manca il CAP. Inseriscilo manualmente.');
            return false;
          }
          if (!formData.residenceProvince) {
            setError('Indirizzo rilevato, ma manca la Provincia (2 lettere).');
            return false;
          }
          if (formData.residenceProvince.length !== 2 && formData.residenceCountry === 'ITALIA') {
            setError('La provincia deve essere di 2 lettere (es: RM, MI, NA).');
            return false;
          }
        }
        return true;
      case 4:
        if (emailSelection === true && (!formData.email || !formData.email.includes('@'))) {
          setError('Inserisci un indirizzo email valido.');
          return false;
        }
        if (phoneSelection === true && !formData.phoneNumber) {
          setError('Inserisci il tuo numero di telefono.');
          return false;
        }
        // If neither is selected, username and password are required
        if (emailSelection === false && phoneSelection === false) {
          if (!formData.username || formData.username.length < 4) {
            setError('Il nome utente deve essere di almeno 4 caratteri.');
            return false;
          }
          
          const password = formData.password;
          const hasAlphanumeric = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          
          if (!password || password.length < 8 || !hasAlphanumeric || !hasSpecial) {
            setError('La password deve essere di almeno 8 caratteri e contenere lettere, numeri e caratteri speciali.');
            return false;
          }
        }
        return true;
      case 5:
        if (!formData.documentFront) {
          setError('È necessario caricare almeno il fronte del documento.');
          return false;
        }
        if (formData.documentType !== 'PASSPORT' && !formData.documentBack) {
          setError('Per questo tipo di documento è richiesto anche il caricamento del retro.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
      setError(null);
    }
  };
  const prevStep = () => {
    setStep(s => s - 1);
    setError(null);
  };

  const useGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata dal tuo browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const olc = new OpenLocationCode();
        const plusCode = olc.encode(latitude, longitude);
        
        // Reverse geocode to get address details
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const { road, house_number, city, town, village, postcode, province, county, country } = data.address;
            setFormData(prev => ({
              ...prev,
              latitude,
              longitude,
              plusCode,
              residenceAddress: (road || '').toUpperCase(),
              residenceNumber: (house_number || '').toUpperCase(),
              residenceCity: (city || town || village || '').toUpperCase(),
              residenceZip: (postcode || '').toUpperCase(),
              residenceProvince: (province || county || '').slice(0, 2).toUpperCase(),
              residenceCountry: (country || '').toUpperCase(),
            }));
            setIsVerifyingAddress(true);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setFormData(prev => ({ ...prev, latitude, longitude, plusCode }));
        }
      },
      (error) => {
        alert('Errore nel recupero della posizione: ' + error.message);
      }
    );
  };

  const handleMapPositionChange = async (pos: [number, number]) => {
    const [lat, lng] = pos;
    const olc = new OpenLocationCode();
    const plusCode = olc.encode(lat, lng);
    
    // Preliminary update for immediate feedback
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      plusCode
    }));

    // Reverse geocode to get address details
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const { road, house_number, city, town, village, postcode, province, county, country } = data.address;
        setFormData(prev => ({
          ...prev,
          residenceAddress: (road || '').toUpperCase(),
          residenceNumber: (house_number || '').toUpperCase(),
          residenceCity: (city || town || village || '').toUpperCase(),
          residenceZip: (postcode || '').toUpperCase(),
          residenceProvince: (province || county || '').slice(0, 2).toUpperCase(),
          residenceCountry: (country || '').toUpperCase(),
        }));
        setIsVerifyingAddress(true);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleRegister = async () => {
    if (!validateStep(5)) return;
    setIsSubmitting(true);
    setError('');
    
    try {
      // Prepare the payload by removing non-serializable File objects
      const { documentFront, documentBack, ...serializableData } = formData;
      
      console.log('Invio dati di registrazione...', serializableData);

      const API_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/api/register';
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializableData),
      });
      
      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Errore durante la registrazione.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      setError('Errore di connessione al server. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsCount = 5;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-brand-blue/10 overflow-hidden mt-24 mb-12 relative">
      {/* Success Message Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-white flex items-center justify-center p-12 text-center"
          >
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <UserCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-serif text-brand-blue">Benvenuto, Cittadino!</h2>
              <p className="text-muted">La tua richiesta è stata registrata con successo nel registro anagrafico mondiale.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-brand-blue text-white rounded-xl"
              >
                Torna alla Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-100 w-full relative">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-brand-blue shadow-[0_0_10px_rgba(10,28,62,0.3)]"
          initial={{ width: '20%' }}
          animate={{ width: `${(step / stepsCount) * 100}%` }}
        />
      </div>

      {/* AI Assistant Bubble */}
      <AnimatePresence>
        {aiTip && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-6 py-3 bg-brand-blue text-white flex items-center gap-3 border-b border-white/10"
          >
            <Sparkles className="w-4 h-4 text-brand-gold shrink-0 animate-pulse" />
            <p className="text-[11px] font-medium italic leading-tight">{aiTip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 md:p-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-brand-blue">{t('personalData')}</h2>
                <p className="text-muted text-xs uppercase tracking-widest italic">Parte 1: Identità Individuale</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('surname')}</label>
                  <input 
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.surname ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                    value={formData.surname}
                    onChange={e => setFormData({ ...formData, surname: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('firstName')}</label>
                  <input 
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.firstName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('gender')}</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all appearance-none"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('birthDate')}</label>
                    <button 
                      type="button"
                      onClick={() => setIsManualDateEntry(!isManualDateEntry)}
                      className="text-[9px] uppercase font-bold text-brand-blue flex items-center gap-1 hover:text-brand-gold transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      {isManualDateEntry ? 'Usa Calendario' : 'Inserimento Manuale'}
                    </button>
                  </div>
                  {isManualDateEntry ? (
                    <input 
                      type="text"
                      inputMode="numeric"
                      placeholder="GG/MM/AAAA"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                      value={manualDate}
                      onChange={e => handleManualDateChange(e.target.value)}
                    />
                  ) : (
                    <input 
                      type="date"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                      value={formData.birthDate}
                      onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('birthPlace')}</label>
                  <input 
                    type="text"
                    placeholder="Es: Roma, Parigi..."
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.birthPlace ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                    value={formData.birthPlace}
                    onBlur={() => setTimeout(() => setBirthPlaceSuggestions([]), 200)}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, birthPlace: val });
                      searchLocation(val, 'birthPlace');
                    }}
                  />
                  <AnimatePresence>
                    {birthPlaceSuggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                      >
                        {birthPlaceSuggestions.map((s, i) => (
                          <button key={i} onClick={() => selectBirthLocation(s, 'birthPlace')} className="w-full text-left px-4 py-2 hover:bg-brand-blue/5 text-xs border-b border-gray-50 flex items-center gap-2 transition-colors">
                            <MapPin className="w-3 h-3 text-brand-blue" />
                            <span className="truncate">{s.display_name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('birthCountry')}</label>
                  <input 
                    type="text"
                    placeholder="Es: Italia, USA..."
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.birthCountry ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                    value={formData.birthCountry}
                    onBlur={() => setTimeout(() => setBirthCountrySuggestions([]), 200)}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, birthCountry: val });
                      searchLocation(val, 'birthCountry');
                    }}
                  />
                  <AnimatePresence>
                    {birthCountrySuggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                      >
                        {birthCountrySuggestions.map((s, i) => (
                          <button key={i} onClick={() => selectBirthLocation(s, 'birthCountry')} className="w-full text-left px-4 py-2 hover:bg-brand-blue/5 text-xs border-b border-gray-50 flex items-center gap-2 transition-colors">
                            <Globe className="w-3 h-3 text-brand-blue" />
                            <span className="truncate">{s.display_name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50 flex-col items-end gap-3">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center gap-2 text-red-600 text-[10px] font-bold bg-red-50 px-4 py-2 rounded-lg border border-red-100"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-medium hover:bg-brand-blue/90 transition-colors shadow-lg"
                >
                  {t('next')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-brand-blue">{t('personalData')} (Cont.)</h2>
                <p className="text-muted text-xs uppercase tracking-widest italic">Cittadinanza e Stato Civile</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 relative">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('citizenship')}</label>
                  <input 
                    type="text"
                    placeholder="Es: Italiana, Francese..."
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.citizenship ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                    value={formData.citizenship}
                    onBlur={() => setTimeout(() => setCitizenshipSuggestions([]), 200)}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, citizenship: val });
                      searchLocation(val, 'citizenship');
                    }}
                  />
                  <AnimatePresence>
                    {citizenshipSuggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                      >
                        {citizenshipSuggestions.map((s, i) => (
                          <button key={i} onClick={() => selectCitizenship(s)} className="w-full text-left px-4 py-2 hover:bg-brand-blue/5 text-xs border-b border-gray-50 flex items-center gap-2 transition-colors">
                            <Flag className="w-3 h-3 text-brand-blue" />
                            <span className="truncate">{s.display_name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('maritalStatus')}</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all appearance-none"
                    value={formData.maritalStatus}
                    onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                  >
                    <option value="Single">Celibe/Nubile</option>
                    <option value="Married">Coniugato/a</option>
                    <option value="Divorced">Divorziato/a</option>
                    <option value="Widow">Vedovo/a</option>
                    <option value="CivilUnion">Unito/a civilmente</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-50 flex-col gap-3">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 px-4 py-2 rounded-lg border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex justify-between w-full">
                  <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 px-8 py-3 border border-brand-blue text-brand-blue rounded-xl font-medium hover:bg-brand-blue/5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t('back')}
                  </button>
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-medium hover:bg-brand-blue/90 transition-colors shadow-lg"
                  >
                    {t('next')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-brand-blue">{t('residenceData')}</h2>
                <p className="text-muted text-xs uppercase tracking-widest italic">Localizzazione e Residenza</p>
              </div>

              <div className="space-y-6">
                {/* Guidance Section */}
                {!isVerifyingAddress ? (
                  <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 space-y-3">
                    <div className="flex items-center gap-2 text-brand-blue">
                      <AlertCircle className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Quale modalità scegliere?</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-[10px] space-y-1">
                        <p className="font-bold text-brand-blue/80 flex items-center gap-1">
                          <User className="w-3 h-3" /> PIÙ FACILE
                        </p>
                        <p className="text-muted leading-tight">Usa l'<b>autocompletamento</b> iniziando a scrivere la tua via. È ideale se abiti in aree urbane mappate.</p>
                      </div>
                      <div className="text-[10px] space-y-1">
                        <p className="font-bold text-brand-blue/80 flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> PIÙ PRECISA
                        </p>
                        <p className="text-muted leading-tight">Usa <b>"La mia posizione"</b> se sei fisicamente a casa. Estrae coordinate GPS e Plus Code univoci.</p>
                      </div>
                      <div className="text-[10px] space-y-1">
                        <p className="font-bold text-brand-blue/80 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> AREE RURALI
                        </p>
                        <p className="text-muted leading-tight">Trascina il <b>Pin sulla mappa</b> e compila la <b>Descrizione Località</b> con punti di riferimento fissi.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 space-y-2 animate-pulse-slow">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Search className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Verifica i dati rilevati</h3>
                    </div>
                    <p className="text-[10px] text-orange-700 leading-tight">
                      Abbiamo estratto i dati dalla mappa. <b>Controlla attentamente CAP e Provincia</b> poiché OpenStreetMap potrebbe non essere preciso al 100%. Modifica i campi se necessario.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 relative">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted ml-1 italic">{t('address')} (Inizia a scrivere per i suggerimenti)</label>
                      <input 
                        type="text"
                        placeholder="VIA / PIAZZA / CORSO..."
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && (!formData.residenceAddress && !formData.plusCode && !(formData.latitude && formData.longitude)) ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                        value={formData.residenceAddress}
                        onBlur={() => setTimeout(() => setAddressSuggestions([]), 200)}
                        onChange={e => {
                          const val = e.target.value.toUpperCase();
                          setFormData({ ...formData, residenceAddress: val });
                          searchLocation(val, 'address');
                          if (isVerifyingAddress) setIsVerifyingAddress(false);
                        }}
                      />
                    </div>
                    
                    {/* Address Suggestions Dropdown */}
                    <AnimatePresence>
                      {addressSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                        >
                          {addressSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectAddress(suggestion)}
                              className="w-full text-left px-4 py-3 hover:bg-brand-blue/5 text-xs border-b border-gray-50 flex items-start gap-3 transition-colors"
                            >
                              <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                              <span className="truncate">{suggestion.display_name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted ml-1">N. Civico</label>
                    <input 
                      type="text"
                      placeholder="ES: 12/A"
                      className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all`}
                      value={formData.residenceNumber}
                      onChange={e => setFormData({ ...formData, residenceNumber: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('zip')}</label>
                      <input 
                        type="text"
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isVerifyingAddress && !formData.residenceZip ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200 animate-pulse' : error && (!formData.residenceAddress && !formData.residenceZip) ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                        value={formData.residenceZip}
                        onChange={e => setFormData({ ...formData, residenceZip: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('city')}</label>
                      <input 
                        type="text"
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isVerifyingAddress && !formData.residenceCity ? 'border-orange-400 bg-orange-50' : error && (!formData.residenceAddress && !formData.residenceCity) ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                        value={formData.residenceCity}
                        onChange={e => setFormData({ ...formData, residenceCity: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('province')}</label>
                      <input 
                        type="text"
                        maxLength={2}
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all uppercase ${isVerifyingAddress && (!formData.residenceProvince || formData.residenceProvince.length !== 2) ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200 animate-pulse' : error && (!formData.residenceAddress && !formData.residenceProvince) ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                        value={formData.residenceProvince}
                        onChange={e => setFormData({ ...formData, residenceProvince: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('country')}</label>
                    <input 
                      type="text"
                      className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all`}
                      value={formData.residenceCountry}
                      onChange={e => setFormData({ ...formData, residenceCountry: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted ml-1">Posizione sulla Mappa (Trascina il Pin)</label>
                    <div className="h-48 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner z-0">
                      <MapContainer 
                        center={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : [41.9028, 12.4964]} 
                        zoom={formData.latitude ? 15 : 5} 
                        scrollWheelZoom={false}
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker 
                          onPositionChange={handleMapPositionChange} 
                          position={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : null} 
                        />
                      </MapContainer>
                    </div>
                    <p className="text-[9px] text-muted italic ml-1 flex items-center gap-1">
                      <MapPin className="w-2 h-2" /> Clicca sulla mappa o trascina il pin per validare la tua posizione esatta.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted ml-1">Plus Code (Location ID)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        readOnly
                        placeholder="Automatico..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-brand-blue text-sm font-mono outline-none"
                        value={formData.plusCode}
                      />
                      <button 
                        onClick={useGetCurrentLocation}
                        className="px-4 py-3 bg-brand-blue/5 text-brand-blue rounded-xl hover:bg-brand-blue/10 transition-colors flex items-center gap-2"
                        title="Rileva posizione attuale"
                      >
                        <Navigation className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase hidden md:inline">Usa la mia posizione</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-muted ml-1">Punti di Riferimento / Descrizione (Max 500 car.)</label>
                      {formData.locationDescription.length > 10 && (
                        <button 
                          onClick={async () => {
                            setIsEnhancing(true);
                            const enhanced = await enhanceLocationDescription(formData.locationDescription, `${formData.residenceAddress} ${formData.residenceCity}`);
                            setFormData(prev => ({ ...prev, locationDescription: enhanced }));
                            setIsEnhancing(false);
                          }}
                          disabled={isEnhancing}
                          className="flex items-center gap-1 text-[9px] font-bold text-brand-gold uppercase hover:text-brand-blue transition-colors disabled:opacity-50"
                        >
                          <Wand2 className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                          {isEnhancing ? 'Miglioramento...' : 'Migliora con AI'}
                        </button>
                      )}
                    </div>
                    <textarea 
                      maxLength={500}
                      rows={2}
                      placeholder="Se l'indirizzo non è preciso, descrivi come raggiungerti (es. vicino alla chiesa, palazzo rosso...)"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all text-sm resize-none"
                      value={formData.locationDescription}
                      onChange={e => setFormData({ ...formData, locationDescription: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-50 flex-col gap-3">
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 px-4 py-2 rounded-lg border border-red-100"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-between w-full">
                    <button 
                      onClick={prevStep}
                      className="flex items-center gap-2 px-8 py-3 border border-brand-blue text-brand-blue rounded-xl font-medium hover:bg-brand-blue/5 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> {t('back')}
                    </button>
                    <button 
                      onClick={nextStep}
                      className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-medium hover:bg-brand-blue/90 transition-colors shadow-lg"
                    >
                      {t('next')} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-brand-blue">{t('contactData')}</h2>
                <p className="text-muted text-sm italic">Informazioni di contatto ufficiali</p>
              </div>

              <div className="space-y-6">
                {/* Email Section */}
                <div className="space-y-4">
                  {emailSelection === null ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-blue/10 rounded-full flex items-center justify-center">
                          <Mail className="w-4 h-4 text-brand-blue" />
                        </div>
                        <span className="text-sm font-medium text-brand-blue">Hai un indirizzo email?</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEmailSelection(true)}
                          className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue/90 transition-all uppercase"
                        >
                          Sì
                        </button>
                        <button 
                          onClick={() => { setEmailSelection(false); setFormData({ ...formData, email: '' }); }}
                          className="px-4 py-2 bg-white border border-brand-blue/20 text-brand-blue text-xs font-bold rounded-lg hover:bg-brand-blue/5 transition-all uppercase"
                        >
                          No
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('email')}</label>
                        <button 
                          onClick={() => { setEmailSelection(null); setFormData({ ...formData, email: '' }); }}
                          className="text-[9px] uppercase font-bold text-brand-blue hover:underline"
                        >
                          Cambia risposta
                        </button>
                      </div>
                      {emailSelection === true ? (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <input 
                            type="email"
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && (!formData.email || !formData.email.includes('@')) ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value.toUpperCase() })}
                            placeholder="INSERISCI LA TUA EMAIL..."
                          />
                        </motion.div>
                      ) : (
                        <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-muted italic">
                          Nessun indirizzo email fornito.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Section (appears after email selection) */}
                {emailSelection !== null && (
                  <div className="space-y-4">
                    {phoneSelection === null ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-blue/10 rounded-full flex items-center justify-center">
                            <Navigation className="w-4 h-4 text-brand-blue" />
                          </div>
                          <span className="text-sm font-medium text-brand-blue">Hai un numero di telefono?</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setPhoneSelection(true)}
                            className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue/90 transition-all uppercase"
                          >
                            Sì
                          </button>
                          <button 
                            onClick={() => { setPhoneSelection(false); setFormData({ ...formData, phone: '' }); }}
                            className="px-4 py-2 bg-white border border-brand-blue/20 text-brand-blue text-xs font-bold rounded-lg hover:bg-brand-blue/5 transition-all uppercase"
                          >
                            No
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('phone')}</label>
                          <button 
                            onClick={() => { setPhoneSelection(null); setFormData({ ...formData, phone: '' }); }}
                            className="text-[9px] uppercase font-bold text-brand-blue hover:underline"
                          >
                            Cambia risposta
                          </button>
                        </div>
                        {phoneSelection === true ? (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2">
                            <div className="w-1/3 relative">
                              <input 
                                type="text"
                                placeholder="+..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all bg-white text-xs font-bold"
                                value={formData.phonePrefix}
                                onFocus={() => setShowPrefixSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowPrefixSuggestions(false), 200)}
                                onChange={e => {
                                  const val = e.target.value;
                                  setFormData({ ...formData, phonePrefix: val });
                                  setPrefixSearch(val);
                                }}
                              />
                              <AnimatePresence>
                                {showPrefixSuggestions && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="absolute z-50 w-64 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto"
                                  >
                                    {countryPrefixes
                                      .filter(p => 
                                        p.name.toLowerCase().includes(prefixSearch.toLowerCase()) || 
                                        p.prefix.includes(prefixSearch) ||
                                        p.code.toLowerCase().includes(prefixSearch.toLowerCase())
                                      )
                                      .map((p, i) => (
                                        <button 
                                          key={i} 
                                          onClick={() => {
                                            setFormData({ ...formData, phonePrefix: p.prefix });
                                            setPrefixSearch(p.prefix);
                                            setShowPrefixSuggestions(false);
                                          }}
                                          className="w-full text-left px-4 py-2 hover:bg-brand-blue/5 text-[10px] border-b border-gray-50 flex items-center justify-between transition-colors"
                                        >
                                          <span className="font-medium">{p.name}</span>
                                          <span className="text-brand-blue font-bold">{p.prefix}</span>
                                        </button>
                                      ))}
                                    {countryPrefixes.filter(p => 
                                        p.name.toLowerCase().includes(prefixSearch.toLowerCase()) || 
                                        p.prefix.includes(prefixSearch) ||
                                        p.code.toLowerCase().includes(prefixSearch.toLowerCase())
                                      ).length === 0 && (
                                      <div className="px-4 py-2 text-[10px] text-muted italic">Nessun prefisso trovato</div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="w-2/3">
                              <input 
                                type="tel"
                                placeholder="NUMERO..."
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && !formData.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                                value={formData.phoneNumber}
                                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value.toUpperCase() })}
                              />
                            </div>
                          </motion.div>
                        ) : (
                          <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-muted italic">
                            Nessun numero di telefono fornito.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Username & Password Section (only if no email and no phone) */}
                {emailSelection === false && phoneSelection === false && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-brand-blue/10"
                  >
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 space-y-2">
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <h4 className="text-[10px] font-bold uppercase">Credenziali di Accesso</h4>
                      </div>
                      <p className="text-[10px] text-orange-700 leading-tight">
                        Non avendo fornito email o telefono, devi creare un <b>Nome Utente</b> e una <b>Password</b> per poter accedere al sistema in futuro.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted ml-1">Nome Utente</label>
                        <input 
                          type="text"
                          placeholder="SCEGLI UN NOME UTENTE..."
                          className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && (!formData.username || formData.username.length < 4) ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                          value={formData.username}
                          onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted ml-1">Password</label>
                        <input 
                          type="password"
                          placeholder="SCEGLI UNA PASSWORD..."
                          className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${error && (!formData.password || formData.password.length < 6) ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-blue'}`}
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <label className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.isAmbassador ? 'border-brand-gold bg-brand-gold/5' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <UserCheck className={`w-5 h-5 ${formData.isAmbassador ? 'text-brand-gold' : 'text-gray-300'}`} />
                    <span className="flex-1 text-sm font-medium">{t('ambassador')}</span>
                    <input 
                      type="checkbox"
                      className="w-4 h-4"
                      checked={formData.isAmbassador}
                      onChange={e => setFormData({ ...formData, isAmbassador: e.target.checked })}
                    />
                  </div>
                </label>

                <label className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.isPeacekeeper ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <Shield className={`w-5 h-5 ${formData.isPeacekeeper ? 'text-brand-blue' : 'text-gray-300'}`} />
                    <span className="flex-1 text-sm font-medium">{t('peacekeeper')}</span>
                    <input 
                      type="checkbox"
                      className="w-4 h-4"
                      checked={formData.isPeacekeeper}
                      onChange={e => setFormData({ ...formData, isPeacekeeper: e.target.checked })}
                    />
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-50 flex-col gap-3">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 px-4 py-2 rounded-lg border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex justify-between w-full">
                  <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 px-8 py-3 border border-brand-blue text-brand-blue rounded-xl font-medium hover:bg-brand-blue/5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t('back')}
                  </button>
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-medium hover:bg-brand-blue/90 transition-colors shadow-lg"
                  >
                    {t('next')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-brand-blue">{t('idDocument')}</h2>
                <p className="text-muted text-sm italic">{t('uploadId')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('docType')}</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all appearance-none"
                    value={formData.documentType}
                    onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                  >
                    <option value="ID_CARD">{t('docIdCard')}</option>
                    <option value="PASSPORT">{t('docPassport')}</option>
                    <option value="LICENSE">{t('docLicense')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('uploadFront')}</label>
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 hover:border-brand-gold transition-colors cursor-pointer group relative ${error && !formData.documentFront ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                      <div className="w-12 h-12 bg-brand-blue/5 rounded-full flex items-center justify-center mx-auto group-hover:bg-brand-gold/10 transition-colors">
                        <Upload className="w-6 h-6 text-brand-blue group-hover:text-brand-gold" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-brand-blue truncate px-2">
                          {formData.documentFront ? formData.documentFront.name : "Seleziona Fronte"}
                        </p>
                        <p className="text-[9px] text-muted uppercase tracking-tighter">PNG, JPG, PDF</p>
                      </div>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={async e => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            const hash = await calculateFileHash(file);
                            setFormData({ ...formData, documentFront: file, documentHash: hash });
                            if (file.type.startsWith('image/')) {
                              setPreviews(prev => ({ ...prev, front: URL.createObjectURL(file) }));
                            }
                          } else {
                            setFormData({ ...formData, documentFront: null, documentHash: '' });
                            setPreviews(prev => ({ ...prev, front: null }));
                          }
                        }}
                      />
                      {previews.front && (
                        <div className="mt-2 relative h-32 w-full rounded-lg overflow-hidden border border-brand-gold/20">
                          <img src={previews.front} alt="Fronte" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviews(prev => ({ ...prev, front: null }));
                              setFormData(prev => ({ ...prev, documentFront: null, documentHash: '' }));
                            }}
                          >
                            <AlertCircle className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted ml-1">{t('uploadBack')}</label>
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 hover:border-brand-gold transition-colors cursor-pointer group relative ${error && formData.documentType !== 'PASSPORT' && !formData.documentBack ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                      <div className="w-12 h-12 bg-brand-blue/5 rounded-full flex items-center justify-center mx-auto group-hover:bg-brand-gold/10 transition-colors">
                        <Upload className="w-6 h-6 text-brand-blue group-hover:text-brand-gold" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-brand-blue truncate px-2">
                          {formData.documentBack ? formData.documentBack.name : "Seleziona Retro"}
                        </p>
                        <p className="text-[9px] text-muted uppercase tracking-tighter">PNG, JPG, PDF</p>
                      </div>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            setFormData({ ...formData, documentBack: file });
                            if (file.type.startsWith('image/')) {
                              setPreviews(prev => ({ ...prev, back: URL.createObjectURL(file) }));
                            }
                          } else {
                            setFormData({ ...formData, documentBack: null });
                            setPreviews(prev => ({ ...prev, back: null }));
                          }
                        }}
                      />
                      {previews.back && (
                        <div className="mt-2 relative h-32 w-full rounded-lg overflow-hidden border border-brand-gold/20">
                          <img src={previews.back} alt="Retro" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviews(prev => ({ ...prev, back: null }));
                              setFormData(prev => ({ ...prev, documentBack: null }));
                            }}
                          >
                            <AlertCircle className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-brand-parchment/50 rounded-xl border border-brand-gold/20 text-[11px] text-brand-blue/70">
                <strong>Nota del Garante:</strong> I dati raccolti verranno utilizzati esclusivamente per la gestione dell'Anagrafe del New World State e protetti secondo i più alti standard di crittografia mondiale.
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-50 flex-col gap-3">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 px-4 py-2 rounded-lg border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex justify-between w-full">
                  <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 px-8 py-4 border border-brand-blue text-brand-blue rounded-xl font-medium hover:bg-brand-blue/5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t('back')}
                  </button>
                  <button 
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-brand-gold text-brand-blue rounded-xl font-bold hover:bg-brand-gold/90 transition-all shadow-lg text-lg uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Inviando...' : t('submit')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
