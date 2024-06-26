/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @next/next/no-img-element */
import Button from '$/lib/components/button/Button';
import LayoutMain from '$/lib/components/layout/LayoutMain';
import GroupForm from '$/lib/components/form/GroupForm';
import { api } from '$/utils/api';
import { getCampusAbbrWithFullName } from '$/utils/data/school';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { Group } from '@prisma/client';

  
/* ------------------------------------------------------------------------------------------------------------------------
------------------------- Page to display all groups of a user ------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------ */
export default function UserGroup() {
    // Create group editing state
    const [isCreating, setIsCreating] = useState(false);

    // Recovery of the session 
    const { data: sessionData } = useSession();
    // Get user name from url
    const { query } = useRouter();
    const name = query.user as string;
    // Get user groups 
    const { data: userGroups } = api.group.groupListByUser.useQuery({name: name}, {enabled: sessionData?.user !== undefined});
    // Delete group
    const { mutate: deleteGroup } = api.group.delete.useMutation();

    // Handlers
    const handleDelete = (gr: Group) => {
        deleteGroup({id: gr.id});
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    // Render
    if(sessionData) 
    return (
        <>
            <LayoutMain>
                            <div className='m-4 flex items-center flex-col w-screen'>
                                <div className='md:text-2xl text-xl mx-12 bg-[var(--purple-g3)] text-center 
                                                    rounded-[5%] p-4 text-fuchsia-700 border-fuchsia-700 border-y-2'>                    
                                        <p>Mes groupes</p>
                                </div>
                                <Button 
                                    onClick={() => setIsCreating(true)}
                                    className=" bg-[var(--purple-g3)] 
                                                hover:bg-[var(--pink-g1)] 
                                                border-[var(--pink-g1)] 
                                                border-2 
                                                text-white 
                                                px-3 py-2 
                                                m-4
                                                rounded-md">
                                Créer un groupe
                                </Button>
                            </div>
                            <div>
                                {userGroups?.map((group) => (
                                    <div key={group.id} className=" border-y-2 
                                                                    text-[var(--pink-g1)] 
                                                                    hover:bg-[var(--pink-g1)] 
                                                                    hover:text-white p-6">
                                        <div className="flex flex-row">
                                            <div className="flex flex-col w-[50%]">
                                                <div className="mb-4 cursor-pointer">
                                                    <label htmlFor="groupName" className="mr-2 font-bold text-[18px] text-left">
                                                        Nom du groupe 
                                                    </label>
                                                    <div id="groupName" className="text-white">{group.name}</div>
                                                </div>
                                                <div className="">
                                                    <label htmlFor="groupPrivacy" className="my-auto font-bold text-base text-left border-b-[1px] border-[var(--purple-g3)]">
                                                        Accessibilité
                                                    </label>
                                                    {group.visibility ? (
                                                        <div className="text-white">Public</div>
                                                    ) : (  
                                                        <div className="text-white">Sur invitation</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col w-[50%]">
                                                <div className="mb-4 ml-4">
                                                    <label htmlFor="groupCampus" className="mr-2 font-bold text-[18px] text-left">
                                                        Destination
                                                    </label>
                                                    <div className="text-white">{getCampusAbbrWithFullName(group.campus)}</div>
                                                </div>
                                                <div className='flex flex-col w-max'>
                                                    <Button 
                                                        onClick={() => window.location.href = `/social/groups/${group.id}`}
                                                        className=" bg-[var(--purple-g3)] 
                                                                    hover:bg-white
                                                                    hover:text-[var(--pink-g1)]
                                                                    border-[var(--pink-g1)]  
                                                                    border-2 
                                                                    text-white 
                                                                    px-3 py-2
                                                                    rounded-md">
                                                            Voir le groupe
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleDelete(group)}
                                                        className=" bg-[var(--purple-g3)] 
                                                                    hover:bg-white
                                                                    hover:text-[var(--pink-g1)]
                                                                    border-[var(--pink-g1)]  
                                                                    border-2 
                                                                    text-white 
                                                                    px-3 py-2
                                                                    mt-2
                                                                    rounded-md">
                                                            Supprimer le groupe
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>   
                                    </div>
                                ))}
                                {isCreating && (
                                    <GroupForm cancelButtonHandler={() => {setIsCreating(false)}}/>
                                )}
                            </div>
            </LayoutMain>
        </>
    );
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
                        onClick={() => void signIn()}>Sign in</Button>
        </LayoutMain>
    )
}