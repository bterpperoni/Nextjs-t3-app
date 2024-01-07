'use client';
import Input from "$/lib/components/form/Input";
import LayoutMain from "$/lib/components/layout/LayoutMain";
import { api } from "$/utils/api";
import type { User } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/dist/client/router";
import { ChangeEvent, useEffect, useState } from "react";
import Dropdown from '../../lib/components/dropdown/Dropdown';
import { data } from "$/utils/data";
import Button from "$/lib/components/button/Button";


export default function User() {

  // a Hook is a function that lets you tap into a React feature like state or lifecycle methods
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState<string>('');
  const [editedEmail, setEditedEmail] = useState<string>('');
  // School & campus
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [isEditingSchool, setIsEditingSchool] = useState<boolean>(false);
  // Handle dropdown change to get selected school & campus
  const handleDropdownChange = (school: string | null, campus: string | null) => {
    setSelectedSchool(school);
    setSelectedCampus(campus);
  };

  const { query, reload } = useRouter();
  const id = query.id as string;


  // Session recovery
  const { data: sessionData } = useSession();

  // Get user by id
  const {data: user} = api.user.userById.useQuery({id: id}, {enabled: sessionData?.user !== undefined});

  // Update user
  const { data: updatedUser, mutate: updateUser } = api.user.update.useMutation();

  // Enable edit mode & set user data in form fields 
  const handleEditClick = () => {
    setIsEditing(true);
    if(user?.name && user?.email) {
      setEditedName(user.name);
      setEditedEmail(user.email);
    }
  };

 // Reload page when user is updated 
 useEffect(() => {
    if (updatedUser) {
      reload();
    }
  }, [updatedUser, reload]);

  // Save user data & disable edit mode
  const handleSaveClick = () => {
    updateUser({
      id: id,
      name: editedName,
      email: editedEmail,
    });
    setIsEditing(false);
  };

  // Enable edit mode for school & campus
  const handleEditClickSchool = () => {
    setIsEditingSchool(true);
  };

  // Save school & campus
  const handleSaveClickSchool = () => {
    setIsEditingSchool(false);
  };

  if (sessionData?.user){
    if(user) {
        return (
        <>
          <LayoutMain>
            <div className="w-[90vw] h-auto mx-auto mt-8 bg-white p-8 rounded shadow-md ">
              <div className="flex flex-col items-center">
                <img className="w-18 h-18 rounded-full" src={sessionData?.user.image} alt="Profile" />
                  <div className="text-left overflow-hidden">
                  <div className="max-w-md overflow-hidden mx-auto mt-4 p-4 border rounded-md shadow-md bg-white">
                    {!isEditing ? (
                      <>
                        <div className="mt-4 flex flex-col md:flex-row items-center">
                          <label htmlFor="username" className="w-full text-center border-b-2 text-xl md:text-2xl text-black">Username :</label>
                          <div id="username" className="mt-1">{user.name}</div>
                        </div>
                        <div className="mt-4 flex flex-col md:flex-row items-center">
                          <label htmlFor="email" className="w-full text-center border-b-2 text-xl md:text-2xl text-black">Email :</label>
                          <div id="email" className="mt-1">{user.email}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Input
                          label="Username :"
                          type="text"
                          value={editedName}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
                          placeholder="Votre nom"
                          classInput="mt-2"
                        />
                        <Input
                          label="Email :"
                          type="email"
                          value={editedEmail}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedEmail(e.target.value)}
                          placeholder="Votre email"
                          classInput="mt-2"
                        />
                      </>
                    )}
                    </div>
                  </div>
              </div>
              <div className="mt-4 flex justify-center">
                {isEditing ? (
                  <Button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleSaveClick}
                  >
                    Enregistrer
                  </Button>
                ) : (
                  <Button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleEditClick}
                  >
                    Modifier mes informations
                  </Button>
                )}
              </div>

              <div className="mt-8 mb-4">
                  {isEditingSchool ? (
                     <Dropdown data={data} onChange={handleDropdownChange} />
                  ) : (
                    <div className="text-center max-w-md mx-auto mt-4 p-4 border rounded-md shadow-md bg-white">
                      <div className="mb-4">
                        <p className="border-b-2 font-medium text-gray-600 text-xl md:text-2xl">Etablissement :</p>
                        <p className="text-base">
                          {data.school.find((school) => school.reference === selectedSchool)?.name}
                        </p>
                      </div>
                      <div>
                        <p className="border-b-2 font-medium text-gray-600 text-lg md:text-xl">Campus :</p>
                        <p className="text-base">
                          {data.school
                            .find((school) => school.reference === selectedSchool)
                            ?.campus.find((campus) => campus.campus_ref === selectedCampus)
                            ?.campus_name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center">
                    {isEditingSchool ? (
                      <Button 
                        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                        onClick={handleSaveClickSchool}
                      >
                      Enregistrer
                      </Button>
                    ) : (
                      <Button 
                        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                        onClick={handleEditClickSchool}  
                      >
                      Changer mon établissement par défaut
                      </Button>
                    )}
                  </div>
                 


                  {selectedSchool && selectedCampus && (
                    <div className="mt-4">
                      <p className="text-gray-600">
                        Ecole : {selectedSchool} - Campus : {selectedCampus}
                      </p>

                      
                    </div>
                    )}
              
              </div>
            </div>
          </LayoutMain> 
        </>
      );
    }
  }
  return (
    <>
      <LayoutMain>
            <h1>Not Connected, <p>Please Sign in</p></h1> 
      </LayoutMain> 
    </>
  );
}
