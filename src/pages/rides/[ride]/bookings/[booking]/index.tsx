/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import Button from "$/lib/components/button/Button";
import LayoutMain from "$/lib/components/layout/LayoutMain";
import Map from "$/lib/components/Map";
import { api } from "$/utils/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import { displayRoute } from "$/hook/distanceMatrix";
import { useMap } from "$/context/mapContext";

/* ------------------------------------------------------------------------------------------------------------------------
------------------------- Page to display details of booking ------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------ */
export default function BookingDetails() {
  // Get id of ride & booking from url
  const { query, push } = useRouter();
  const id = query.booking;
  const rideIdFromUrl = query.ride;
  // Session recovery
  const { data: sessionData } = useSession();

  // Get booking by the id in the url
  const { data: fetchedBooking } = api.booking.bookingById.useQuery(
    { id: parseInt(id as string) },
    { enabled: sessionData?.user !== undefined },
  );

  // Get the attached ride at this booking
  const { data: fetchedRide } = api.ride.rideById.useQuery(
    { id: parseInt(rideIdFromUrl as string) },
    { enabled: sessionData?.user !== undefined },
  );

  // Delete booking
  const { mutate: deleteBooking } = api.booking.delete.useMutation();

  // Get lat & lng of driver departure & pick up point passenger
  const departureLatLng: google.maps.LatLngLiteral = {
    lat: fetchedRide?.departureLatitude!,
    lng: fetchedRide?.departureLongitude!,
  };
  const destinationLatLng: google.maps.LatLngLiteral = {
    lat: fetchedBooking?.pickupLatitude!,
    lng: fetchedBooking?.pickupLongitude!,
  };

  // Map options
  const zoom = 12;

  // Access the map object
  const mapRef = useMap();

  // Used to define if the map is loaded
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Display route on map when booking & ride are fetched
    if (fetchedBooking !== undefined && fetchedRide !== undefined) {
      if ((departureLatLng && destinationLatLng) !== undefined) {
        console.log("Booking verified :", fetchedBooking);
        console.log("Ride verified :", fetchedRide);
      }
    }
  }, [fetchedBooking, fetchedRide]);


  if (sessionData) {
    return (
      <LayoutMain>
        <div className="flex flex-col items-center">
          <h2 className="mb-4 mt-4 w-full w-max rounded-lg bg-fuchsia-700 p-4 text-center text-2xl font-bold text-white shadow-lg md:text-4xl">
            Détails de la réservation
          </h2>
        </div>
        <div className="ride-details-container">
          <div className="ride-info flex flex-row justify-between">
            <div>
              <span className="label">Départ:</span>
              {fetchedRide?.departure.split(",", 2).toString()} le{" "}
              {fetchedRide?.departureDateTime.toLocaleDateString()} à{" "}
              {fetchedRide?.departureDateTime.toLocaleTimeString()}
            </div>
          </div>
          <div className="ride-info flex flex-row justify-between">
            <div>
              <span className="label">Pt. de ramassage:</span>
              {fetchedBooking?.pickupPoint.split(",", 2).toString()}
            </div>
          </div>
          <div className="ride-info flex flex-row justify-between">
            <div>
              <span className="label">Prix estimé:</span>
              {fetchedBooking?.price} €
            </div>
          </div>
          {fetchedRide?.returnTime != null && (
            <div className="ride-info flex flex-row justify-between">
              <div>
                <span className="label">Heure de retour:</span>
                {fetchedRide.returnTime.toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* 
          
///
                                      Display the buttons to update or delete the booking
             
          ///
          */}
          <div className="flex h-full w-auto flex-row justify-between">
            <Button
              className=" mb-4 
                          mr-2
                          mt-3 
                          h-max 
                          rounded-md 
                          bg-blue-500 
                          px-3 
                          py-2 text-white 
                          hover:border-2 
                          hover:border-blue-500
                          hover:bg-white hover:text-blue-500"
              onClick={() =>
                location.replace(
                  `/rides/${fetchedRide?.id}/bookings/${id}/update`,
                )
              }
            >
              Modifier
            </Button>
            <Button
              onClick={() =>
                deleteBooking(
                  { id: parseInt(id as string) },
                  {
                    onSuccess: () => {
                      alert("La réservation a été supprimée avec succès");
                      void push(`/rides/${fetchedRide?.id}`);
                    },
                  },
                )
              }
              className="mb-4
                         mt-3 
                         h-max 
                         rounded-md
                         bg-red-500
                         px-3 
                         py-2 
                         text-white 
                         hover:border-2 
                         hover:border-red-500  
                         hover:bg-white
                         hover:text-red-500"
            >
              Supprimer
            </Button>
          </div>
          <Map zoom={zoom} onMapLoad={async () => {
            setIsMapLoaded(true);
            if (isMapLoaded) {
              if (fetchedBooking !== undefined && fetchedRide !== undefined) {
                const directionsService = new google.maps.DirectionsService();
                const directionsRenderer = new google.maps.DirectionsRenderer(
                  { map: mapRef.current }
                );
                // Display route on map
                void displayRoute(
                  directionsService,
                  directionsRenderer,
                  departureLatLng,
                  destinationLatLng,
                );
              }
            }
          }} />
          <style jsx>{`
            .ride-details-container {
              background-color: var(--purple-g3);
              border: 2px solid #e0e0e0;
              border-radius: 10px;
              color: white;
              padding: 20px;
              margin: 20px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            .ride-info {
              font-size: 1rem;
              margin-bottom: 5px;
              border-bottom: 2px solid #ffffff;
            }

            .label {
              font-weight: bold;
              margin-right: 5px;
            }
          `}</style>
        </div>
      </LayoutMain>
    );
  }
}
