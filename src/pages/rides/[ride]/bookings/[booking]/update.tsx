import Button from "$/lib/components/button/Button";
import BookingForm from "$/lib/components/form/BookingForm";
import LayoutMain from "$/lib/components/layout/LayoutMain";
import { api } from "$/utils/api";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";


export default function UpdateBooking() {
    // Get session
    const { data: sessionData } = useSession();
    // Get router
    const { query } = useRouter();
    // Get RideId from url
    const rideId = query.ride;
    const bookingId = query.booking;
    // Get ride by id
    const {data: rideForBooking} = api.ride.rideById.useQuery({id: parseInt(rideId as string)}, {enabled: sessionData?.user !== undefined});
    // Get booking by id
    const { data: bookingToUpdate } = api.booking.bookingById.useQuery({id: parseInt(bookingId as string)}, {enabled: sessionData?.user !== undefined});
    
    // ________________________________ RENDER ________________________________
    if(sessionData?.user) {
        return (
        <LayoutMain>
            <div className="flex flex-col items-center">
            <h2 className=" mb-4 mt-4 w-full w-max rounded-lg bg-fuchsia-700 p-4 text-center text-2xl font-bold text-white shadow-lg md:text-4xl">
                    Modifier votre réservation
                </h2>
                <BookingForm ride={rideForBooking ?? undefined} booking={bookingToUpdate ?? undefined} />
            </div>
        </LayoutMain>
        );
    }
    return (   
        <LayoutMain>
                    <h1>Not Connected, Please Sign in</h1>
                    <Button 
                        className=" m-4 
                                    rounded-full 
                                    bg-white/10 
                                    px-10 
                                    py-3 
                                    font-semibold 
                                    text-white 
                                    no-underline 
                                    transition 
                                    hover:bg-white/20" 
                        onClick={() => void signIn()}>Se connecter</Button>
        </LayoutMain>
    );
}