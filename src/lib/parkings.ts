export type Parking = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  pricePerHour: number;
  spots: number;
  available: number;
};

export const PARKINGS: Parking[] = [
  { id: "p1", name: "Parqueadero La Candelaria Centro", address: "Cra 1 #18A-20", lat: 4.5996, lng: -74.0691, pricePerHour: 6000, spots: 60,  available: 18 },
  { id: "p2", name: "Parqueo Museo Zona",               address: "Cl 18 #2-15",   lat: 4.5983, lng: -74.0687, pricePerHour: 6500, spots: 40,  available: 10 },
  { id: "p3", name: "Parqueadero Parque de los Periodistas", address: "Cl 17 #3-50", lat: 4.6004, lng: -74.0703, pricePerHour: 7000, spots: 75, available: 25 },
  { id: "p4", name: "Parqueo La Concordia",             address: "Cra 2 #14-30",  lat: 4.5976, lng: -74.0712, pricePerHour: 6500, spots: 50,  available: 12 },
  { id: "p5", name: "Parqueadero Museo Botero",         address: "Cl 11 #4-41",   lat: 4.5998, lng: -74.0719, pricePerHour: 7500, spots: 35,  available: 8  },
  { id: "p6", name: "Parqueo Las Aguas",                address: "Cra 3 #18-60",  lat: 4.6009, lng: -74.0689, pricePerHour: 6000, spots: 90,  available: 32 },
  { id: "p7", name: "Parqueadero Calle 19",             address: "Cl 19 #1-25",   lat: 4.5987, lng: -74.0719, pricePerHour: 5500, spots: 55,  available: 20 },
  { id: "p8", name: "Parqueadero Chorro de Quevedo",    address: "Cra 2 #12B-15", lat: 4.5978, lng: -74.0696, pricePerHour: 7000, spots: 28,  available: 6  },
  { id: "p9", name: "Parqueo Egipto Bajo",              address: "Cra 1 #10-30",  lat: 4.5969, lng: -74.0689, pricePerHour: 5000, spots: 22,  available: 7  },
  { id: "p10",name: "Parqueadero Vicentico",            address: "Cl 20 #1-10",   lat: 4.6009, lng: -74.0710, pricePerHour: 6000, spots: 48,  available: 15 },
];

export const getParkingById = (id: string) => PARKINGS.find(p => p.id === id) || null;
