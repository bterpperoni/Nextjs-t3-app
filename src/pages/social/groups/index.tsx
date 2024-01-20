/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Button from "$/lib/components/button/Button";
import Slider from "$/lib/components/button/Slider";
import Dropdown from "$/lib/components/dropdown/Dropdown";
import Input from "$/lib/components/form/Input";
import LayoutMain from "$/lib/components/layout/LayoutMain";
import { api } from "$/utils/api";
import { data, getCampusAbbr  } from "$/utils/data";
import { Group } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import UserGroup from "./users/[name]";


export default function Groups() {
    // -------------------------------State------------------------------------------------------
    // Create group editing state
    const [isCreating, setIsCreating] = useState(false);
    // School & campus state
    const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
    const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
    // Group name state
    const [groupName, setGroupName] = useState<string>('');
    // Slider state (public/private group)
    const [isPrivate, setisPrivate] = useState<boolean>(false);
    // Session recovery
    const { data: sessionData } = useSession();
    // Get groups
    const { data: groupsData } = api.group.groupList.useQuery(undefined, {
        enabled: sessionData?.user !== undefined
    });
    // Create group
    const { data: createdGroup, mutate: createGroup } = api.group.create.useMutation();
    // Group list by user
    const { data: userGroups } = api.groupMember.groupMemberListByUser.useQuery({userId: sessionData?.user.id ?? '', validated: true}, {enabled: sessionData?.user !== undefined});
    // Join group
    const { mutate: createMemberGroup } = api.groupMember.create.useMutation();

    // Get router
    const router = useRouter();
    // ------------------------------- Handlers ------------------------------------------------------
    useEffect(() => {
        if(createdGroup){
            if(sessionData){
                const groupMember = {
                    userId: sessionData.user.id,
                    groupId: createdGroup.id,
                    validated: true
                }
                createMemberGroup(groupMember);
            }
            setTimeout(() => {
                alert('Groupe créé !');
            }, 1000)
        }
    }, [createdGroup])

    // Check if the group is public or private
    const handleCheck = () => {
        if(isPrivate) setisPrivate(!isPrivate);
        else setisPrivate(!isPrivate);
    }

    // Save group
    function handleSaveGroup(){
        if(sessionData){
            if (selectedSchool && selectedCampus && groupName) {
                const tmpDivCampus = selectedSchool+'-'+selectedCampus;
                const group = {
                    name: groupName,
                    campus: tmpDivCampus,
                    createdBy: sessionData.user.name,
                    visibility: isPrivate
                }
                createGroup(group);
                setIsCreating(false);
            }
        }
    }

    // Join group
    function joinGroup(gr: Group){
        if(sessionData){
            if(!gr.visibility){
                const groupMember = {
                    userId: sessionData.user.id,
                    groupId: gr.id,
                    validated: true
                }
                createMemberGroup(groupMember);
                setTimeout(() => {
                    alert("Groupe rejoind avec succès !")
                    router.reload();
                }, 1000)
            }else{
                const groupMember = {
                    userId: sessionData.user.id,
                    groupId: gr.id,
                    validated: false
                }
                createMemberGroup(groupMember);
                setTimeout(() => {
                    alert("Demande pour rejoindre le groupe envoyé avec succès !")
                    router.reload();
                }, 1000)
            }
        }
    }
    // ------------------------------- Render ------------------------------------------------------
    if (sessionData) {
        return (
            <LayoutMain>        
                <div className='flex flex-col items-center'>
                    <div className='border-0 m-4'>   
                        <div className='md:text-2xl text-xl mx-12 bg-[var(--purple-g3)] text-center 
                                        rounded-[5%] p-4 text-fuchsia-700 border-fuchsia-700 border-y-2'>                    
                            <p>Trouver un groupe</p>
                        </div>
                    </div>
                    <div className="mb-4 flex flex-row justify-between w-[90%]">
                        <Button 
                                onClick={() => setIsCreating(true)}
                                className="bg-[var(--purple-g3)] hover:bg-[var(--pink-g1)] border-[var(--pink-g1)] 
                                           border-2 text-white px-3 py-2 rounded-md">
                                Créer un groupe
                        </Button>
                        <Button 
                                onClick={() => router.push(`/social/groups/users/${sessionData.user.name}`)}
                                className="bg-[var(--purple-g3)] hover:bg-[var(--pink-g1)] border-[var(--pink-g1)] 
                                           border-2 text-white px-3 py-2 rounded-md">
                                Mes groupes
                        </Button>
                    </div>
                    
                    <div className="bg-[var(--purple-g3)] w-[85vw] h-[80vh] rounded-[2%]">
                        <div className="">
                            <div className="border-y-2 mb-4">
                                <div className="text-[var(--pink-g0)] flex flex-row justify-center">
                                    <div className="m-6 text-2xl bold text-center">
                                        Trouves des étudiants qui se rendent au même établissement.
                                        <p className="text-xl text-center">Crée un groupe ou rejoind en un et commences à covoiturer. </p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-2 border-indigo-500">
                            {/* ---------------------------------- Group Card ----------------------------------------- */}
                                {groupsData?.map((group) => (
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
                                                        <div className="text-white">Sur invitation</div>
                                                    ) : (  
                                                        <div className="text-white">Public</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col w-[50%]">
                                                <div className="mb-4">
                                                    <label htmlFor="groupCampus" className="mr-2 font-bold text-[18px] text-left">
                                                        Destination
                                                    </label>
                                                    <div className="text-white">{getCampusAbbr(group.campus)}</div>
                                                </div>
                                                <div className="flex-col flex">
                                                    {userGroups?.find((userGroup) => userGroup.groupId === group.id) ? (
                                                        <div className="flex flex-col">
                                                            <Button 
                                                                onClick={() => router.push(`/social/groups/${group.id}`)}
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
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                                <Button 
                                                                    onClick={() => joinGroup(group)}
                                                                    className=" bg-[var(--purple-g3)] 
                                                                            hover:bg-white 
                                                                            hover:text-[var(--pink-g1)] 
                                                                            border-[var(--pink-g1)] 
                                                                            border-2    
                                                                            text-white 
                                                                            px-3 py-2 
                                                                            rounded-md"
                                                                >
                                                                Rejoindre le groupe
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                
                                            </div>
                                        </div>   
                                    </div>
                                ))}
                            {/* ---------------------------------- /Group Card ----------------------------------------- */}
                            </div>
                        </div>
                    </div>
                </div>
                

                {/* --------------------------------------- Form to create à new group ------------------------------------------- */}
                {isCreating && (
                    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white rounded-md px-4 py-2">
                            <form>
                                <div className="flex flex-col mb-2">
                                    <Input 
                                        label="Nom du groupe :" 
                                        type="text"
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setGroupName(e.target.value)}
                                        value={groupName}
                                        placeholder="Eg. Les copains de la route"
                                        classInput="mt-2 p-2 w-full"
                                    />
                                </div>
                                <div className="flex flex-col mb-4 overflow-hidden">
                                    <Dropdown 
                                        data={data} 
                                        onChange={(sc: ChangeEvent<HTMLSelectElement>, ca: ChangeEvent<HTMLSelectElement> ) => {
                                        setSelectedSchool(sc.target.value);
                                        if(sc) setSelectedCampus(ca.target.value);
                                        }} 
                                    />
                                </div>
                                <div className="flex flex-row mb-4 justify-center items-center">
                                    <label className="text-black text-left mr-2">
                                        Privé
                                    </label>
                                    <Slider check={handleCheck} checked={isPrivate} />
                                    <label className="text-black text-left ml-2">
                                        Public
                                    </label>
                                </div>
                                {/* ------------------------------ BUTTON FORM ---------------------------------------------------- */}
                                <div className="flex flex-row justify-between">
                                    <Button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="bg-[var(--purple-g2)] hover:bg-[var(--pink-g1)] border-[var(--pink-g1)] 
                                                    border-2 text-white px-3 py-2 rounded-md">
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        onClick={handleSaveGroup}
                                        className="bg-[var(--purple-g2)] hover:bg-[var(--pink-g1)] border-[var(--pink-g1)] 
                                                    border-2 text-white px-3 py-2 rounded-md">
                                        Créer un groupe
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </LayoutMain>
        );
    }
    return (   
        <LayoutMain>
            <h1>Groups</h1>
            <p className="text-white">You must be signed in to view this page</p>
        </LayoutMain>
    );
}