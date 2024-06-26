'use  server';
import { useApiKey } from "$/context/apiContext";
import Autocomplete from "react-google-autocomplete";
import { useSession } from "next-auth/react";
import { api } from "$/utils/api";
import { useEffect, useState } from "react";
import Button from "$/lib/components/button/Button";
import { calculateDetourEligibility, calculateDistance } from "$/hook/distanceMatrix";
import type { Booking, Ride } from "@prisma/client";
import Error from "next/error";
import { Loader } from "@googlemaps/js-api-loader";


export default function BookingForm({
  ride,
  booking,
}: {
  ride: Ride | undefined;
  booking?: Booking;
}) {
  // ________________________________ STATE ________________________________
  const apiKey = useApiKey();
  
  // Session recovery
  const { data: sessionData } = useSession();

  // Address of departure (got from 'ride' object)
  const origin = ride?.departure ?? "";
  // Address of destination (got from 'ride' object)
  const destination = ride?.destination ?? "";
  // Address of pickup point (got from booking object)
  const destPickup: string[] = [];

  // Fetch the passengers details and here details ride
  const { data: passengers } = api.booking.bookingByRideId.useQuery(
    { rideId: ride?.id ?? 0},
    { enabled: sessionData?.user !== undefined },
  );

  // Address of pickup point + Latitude and Longitude (got from Autocomplete)
  const [destinationBooking, setDestinationBooking] = useState<string | null>(
    null,
  );
  const [destinationLatitude, setDestinationLatitude] = useState<number | null>(
    null,
  );
  const [destinationLongitude, setDestinationLongitude] = useState<number | null>(null);

  // Get all pickup points
  useEffect(() => {
    passengers?.forEach((passenger) => {
        if(destPickup.includes(passenger.pickupPoint) === false){
          destPickup.push(passenger.pickupPoint);
        }
        if(passenger.pickupPoint === booking?.pickupPoint){
          destPickup.pop();
        }
    });
    
    if(destPickup.length > (passengers?.length ?? 1)){
      destPickup.pop();
    }
    if(destinationBooking !== null){
      destPickup.push(destinationBooking);
    }
    console.log("Way Points: " , destPickup);
    void setTimeAndDistanceWithWayPoint();
  }, [passengers, destinationBooking]);

  
  //  Max distance driver can go to pick up passenger
  const maxDistanceDetour = ride?.maxDetourDist ?? 0;
  // Distance in kilometers between driver departure and passenger destination
  const [distanceToPassengerInKm, setDistanceToPassengerInKm] =
    useState<number>(0);
  // Distance in kilometers between passenger pickup point and destination
  const [distanceToDestinationInKm, setDistanceToDestinationInKm] =
    useState<number>(0);
  // Total distance between origin and destination
  const [totalDistance, setTotalDistance] = useState<number>(0);

  const [totalTime, setTotalTime] = useState<number>(0);
  // Price of ride
  const [priceRide, setPriceRide] = useState<string>();

  // Is booking eligible
  const [bookingEligible, setBookingEligible] = useState<boolean>(false);

  // Price for fuel per kilometer
  const fuelPrice = 0.12;
  
  // Options for autocomplete
  const options = {
    componentRestrictions: { country: "be" },
    strictBounds: false,
    types: ["address"],
  };

  // Create new booking
  const { data: bookingCreated, mutate: createBooking } =
    api.booking.create.useMutation();
  // Update booking
  const { data: bookingUpdated, mutate: updateBooking } =
    api.booking.update.useMutation();

    const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load the Google Maps API when the component is mounted
  useEffect(() => {
    if (!apiKey) throw new Error({ title: "API key is not defined", statusCode: 404 });

    // Initialize the loader of the Google Maps API
    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
      region: "BE",
      retries: 3,
      language: "fr"
    });

    void loader.importLibrary("places").then((google) => {
      if(google === null) throw new Error({ title: "Google Places API not loaded", statusCode: 404 });
      setIsLoaded(true);
    });
  });


  // When click on submit button
  function handleClick() {
    if (sessionData) {
      if (booking) {
        console.log("Pickup point: ", destinationBooking);
        // ------------------- Update booking -------------------
        updateBooking({
          id: booking.id,
          rideId: ride?.id ?? 0,
          userId: sessionData.user.id,
          pickupPoint: destinationBooking ?? booking.pickupPoint,
          pickupLatitude: destinationLatitude ?? booking.pickupLatitude,
          pickupLongitude: destinationLongitude ?? booking.pickupLongitude,
          price: priceRide?.toString() ?? booking.price,
          status: "UPDATED",
        });
      } else {
        // ------------------- Create booking -------------------
        createBooking({
          rideId: ride?.id ?? 0,
          userId: sessionData.user.id,
          pickupPoint: destinationBooking ?? "",
          pickupLatitude: destinationLatitude ?? 0,
          pickupLongitude: destinationLongitude ?? 0,
          price: priceRide?.toString() ?? "0",
          status: "CREATED",
        });
      }
    }
  }

  async function setTimeAndDistanceWithWayPoint() {
    const distanceToWaypoint = await calculateDistance(origin, destinationBooking ?? "");
    const distanceToWaypointInKm = distanceToWaypoint.distance / 1000;
    const distanceToDestination = await calculateDistance(destinationBooking ?? "", destination);
    const distanceToDestinationInKm = distanceToDestination.distance / 1000;
    /* ----DISTANCE TOTAL FROM ORIGIN TO DESTINATION --- */
    const distanceInMeters = await calculateDistance(origin, destination);
    const distanceInKm = distanceInMeters.distance / 1000;
    const timeInMinutes = distanceInMeters.duration / 60;
    setTotalTime(parseFloat(timeInMinutes.toFixed(0)));
    setTotalDistance(parseFloat(distanceInKm.toFixed(2)));

    setDistanceToPassengerInKm(distanceToWaypointInKm);
    setDistanceToDestinationInKm(distanceToDestinationInKm);
  }



  useEffect(() => {
    async function checkEligibility() {
      if (
        ride &&
        origin &&
        ((destinationBooking ?? destPickup) !== null)
      ) {
        // const maxTime = ride?.departureDateTime.getHours() * 60;
        await calculateDetourEligibility(
          origin,
          destination,
          destPickup,
          maxDistanceDetour
        ).then((result) => {
          setBookingEligible(result.eligibility);
          console.log("Eligibility: ", result.eligibility);
              // Price calculation
          setPriceRide((result.detourDifference * fuelPrice).toFixed(2));
          // passengers?.forEach((passenger) => { 
          //   if(passenger.userId !== sessionData?.user.id){
          //     updateBooking({
          //       id: passenger.id,
          //       rideId: ride?.id ?? 0,
          //       userId: passenger.userId,
          //       pickupPoint: passenger.pickupPoint,
          //       pickupLatitude: passenger.pickupLatitude,
          //       pickupLongitude: passenger.pickupLongitude,
          //       price: priceRide?.toString() ?? passenger.price,
          //       status: "UPDATED",
          //     });
          //   }
          //  });
        }).catch((err) => {
          console.log(err);
        });
      }
    }
    void checkEligibility();
  }, [destinationBooking]);

    // Redirect to ride page when booking is created
    useEffect(() => {
      if (bookingCreated ?? bookingUpdated) {
        location.assign(
          `/rides/${ride?.id}/bookings/${bookingCreated?.id ?? bookingUpdated?.id}`,
        );
      }
    }, [bookingCreated, bookingUpdated]);

  // ________________________________ RENDER ________________________________
  return (
    <>
      <div className="mt-2 flex w-[90vw] flex-col p-2 md:flex-row">
        <p className="text-gray-400 md:text-2xl"></p>
        <label
          htmlFor="destination"
          className=" mb-1 
                      mr-2 
                      text-[1.25rem] 
                      text-[var(--pink-g1)] md:text-2xl"
        >
          Où souhaitez vous que l'on vous récupère ?
        </label>
        {/* This autocomplete will be used as destination to calcul distance from driver departure to this address */}
        {isLoaded && (
          <Autocomplete
          defaultValue={destinationBooking ?? destPickup}
          apiKey={apiKey}
          options={options}
          onPlaceSelected={(place) => {
            if(place.formatted_address !== undefined)
            setDestinationBooking(place.formatted_address);
            if (
              place.geometry?.location?.lat() &&
              place.geometry?.location?.lng()
            ) {
              setDestinationLatitude(place.geometry.location.lat());
              setDestinationLongitude(place.geometry.location.lng());
            }
            console.log("Destination: ", place);
          }}
          className="my-2 
                    w-[75%] 
                    border-2
                    border-[var(--purple-g1)] bg-[var(--purple-g3)]
                    p-2
                    text-xl 
                    text-white 
                    md:w-[75%] md:text-2xl"
          id="destination"
        />
    )}
      </div>
      <div className="m-1 mt-5 flex w-[90vw] flex-col border-t-2 border-[var(--pink-g1)] p-2">
        <div className="text-xl text-white">
          <p>Total = {totalDistance} km</p>
          <p>
            Départ :
            <span className="text-[var(--pink-g1)]"> {ride?.departure}</span>
          </p>
          <p>
            Addresse du point de passage :
            <span className="text-[var(--pink-g1)]">
              {" "}
              {destinationBooking ?? destPickup
                ? destinationBooking ?? destPickup
                : "Aucune addresse n'a été saisie"}
            </span>
          </p>
        </div>
      </div>
      {(destinationBooking ?? destPickup) && (
        <>
          <div className="mt-5 flex w-[90vw] flex-col border-y-2 border-[var(--pink-g1)] p-2">
            <div className="text-xl text-white">
              <p>
                Départ - Pt. passage:
                <span className="text-[var(--pink-g1)]">
                  {" "}
                  {distanceToPassengerInKm} km
                </span>
              </p>
              <p>
                Pt. passage - Destination:
                <span className="text-[var(--pink-g1)]">
                  {" "}
                  {distanceToDestinationInKm} km
                </span>
              </p>
              <p>
                Êtes-vous éligible à la réservation ?
                <span className="text-[var(--pink-g1)]">
                  {bookingEligible ? " Oui" : " Non"}
                </span>
              </p>
              {bookingEligible && (
                <>
                  <p>
                    Prix estimé du trajet :
                    <span className="text-[var(--pink-g1)]">
                      ~ {priceRide} €
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
          {bookingEligible === true ? (
            <>
              <div className="m-4 mt-6 flex w-full flex-row items-center justify-around">
                {booking ? (
                  <>
                    <Button
                      onClick={handleClick}
                      className="col-span-1 w-max rounded-full border-2 
                                 border-[var(--pink-g1)] bg-[var(--purple-g3)] px-3 py-2 text-base text-white hover:bg-[var(--pink-g1)]"
                    >
                      Modifier la réservation
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleClick}
                      className="col-span-1 w-max rounded-full border-2 
                                 border-[var(--pink-g1)] bg-[var(--purple-g3)] px-3 py-2 text-base text-white hover:bg-[var(--pink-g1)]"
                    >
                      Confirmer la réservation
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="m-4 mt-6 flex w-full flex-row items-center justify-around">
                <Button
                  disabled
                  className="cursor-not-allowed rounded-lg border-2 border-gray-500 px-3 py-2 text-gray-300"
                >
                  Confirmer la réservation
                </Button>
              </div>
            </>
          )}
        </>
      )}
      <Button
        className="my-2 h-10 w-24 rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600"
        onClick={() =>
          booking
            ? location.assign(`/rides/${ride?.id}/bookings/${booking?.id}`)
            : location.assign(`/rides/${ride?.id}/`)
        }
      >
        Annuler
      </Button>
    </>
  );
}
