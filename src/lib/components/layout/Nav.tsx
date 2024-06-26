/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @next/next/no-img-element */
import { Fragment, useEffect, useState } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import type { Notification } from '$/lib/types/types'
import { api } from '$/utils/api'
import 'react-toastify/dist/ReactToastify.css';
import { usePusher } from '$/context/pusherContext'

const navigation = [
  { name: 'Accueil', href: '/', current: false },
  { name: 'Trajets', href: '/rides', current: false },
  { name: 'Portefeuille', href: '/wallet', current: false },
  { name: 'Groupe', href: '/social/groups', current: false },
  { name: 'Calendrier', href: '/calendar/', current: false },
  { name: 'Contact', href: '#', current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Nav() {
  const { data: session } = useSession();
  
  useEffect(() => {
    navigation.map((item) => {
      if (window.location.pathname === item.href) {
        item.current = true;
      } else {
        item.current = false;
      }
    })
  }
  , [navigation])

  // Get the list of unread notifications
  const { data: unreadnotifications } = api.notification.unreadNotificationListByUser.useQuery(undefined,
    { enabled: session?.user !== undefined }
  );
  // Update unread notifications to read
  const { mutate: updateNotification } = api.notification.update.useMutation();

  const handleNotificationRead = async (id: number) => {
    updateNotification({ id, read: true });
    location.assign(`/calendar/`);
  }

  // Display the list of unread notifications
  useEffect(() => {
    if (unreadnotifications) {
      console.log("Unread Notifications: ", unreadnotifications);
    }
  }, [unreadnotifications]);


  // Get pusher instance
  const pusher = usePusher();

  // Notifications List  
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    if(session){
        // Subscribe to the channel related the current user
        const channel = pusher.subscribe(`passenger-channel-${session.user.id}`);
        
        function handleNewNotification(data: Notification ){
          const newMessages = [...messages, data.message]
          setMessages(newMessages)
          alert(data.message);
        }

        // Bind to the ride-started event & add the notification to the list
        channel.bind('ride-started', handleNewNotification);
         
        return () => {
          channel.unbind('ride-started', handleNewNotification);
        }
    }
  }, [session?.user.id])

  return (
  
    <Disclosure as="nav" className="bg-gray-800 absolute top-0 w-full z-1">
    {({ open }: { open: boolean }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button 
                  className=" absolute 
                              inline-flex 
                              items-center 
                              justify-center 
                              rounded-md 
                              p-2 
                              text-gray-400 
                              hover:bg-gray-700 
                              hover:text-white 
                              focus:outline-none 
                              focus:ring-2 
                              focus:ring-inset 
                              focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-10 w-auto rounded-full "
                    src="/images/logo.png"
                    alt="CarHeh"
                  />
                  <p className="text-white ml-2">
                    CarHeH
                  </p>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4 absolute">
                    {navigation.map((item) => (
                      <a
                        key={item.name}  
                        href={item.href}
                        className={
                          classNames(
                            item.current ? 
                            'bg-gray-900 text-white' 
                            : 
                            'text-gray-300 hover:bg-gray-700 hover:text-white',
                            'rounded-md px-3 py-2 text-sm font-medium')}
                        aria-current={item.current ? 'page' : undefined}>
                          {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

                {session && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  {/* DaisyUI notifications icon + floating icon for number of */}
                    <Menu as="div" className="relative right-1">
                    <div className="ds-indicator mr-1 cursor-pointer">
                      {unreadnotifications && unreadnotifications.length > 0 && (
                        <span className="animate-ping-fast absolute inline-flex top-0 right-0 h-2 w-3 rounded-full 
                                         ring-2 ring-red-200 bg-red-500 z-10"></span>
                      )}
                      <Menu.Button className=" relative flex rounded-full bg-gray-800 text-sm focus:outline-none 
                                               focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-7 w-7" aria-hidden="true" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 
                                             shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none top-7 z-10 
                                             border-2 border-gray-400">
                        {(unreadnotifications && unreadnotifications.length > 0) ? 
                          unreadnotifications?.map((notification, index) => (
                            <Menu.Item key={index}>
                              {({ active }) => (
                                <>
                                  <a 
                                    className={classNames(active ? 'bg-gray-100' : '', 'border-b-2 border-gray-400 block px-4 py-2 text-sm text-gray-700')} 
                                    onClick={() => handleNotificationRead(notification.id)}>
                                    {notification.message}
                                  </a>
                                </>
                              )}
                            </Menu.Item>
                          )): (
                            <Menu.Item>
                              {({ active }) => (
                                <a 
                                  className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                                  No notifications
                                </a>
                              )}
                            </Menu.Item>
                          )}
                      </Menu.Items>
                    </Transition>
                    </div>
                    </Menu>
                 
                  {/* ----------------------------------------------------------------------------- */}
                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                  <div>
                    {/* Profile dropdown */}
                    <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none 
                                            focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <img 
                        width={40}
                        height={40}
                        className="rounded-full"
                        src={session?.user.image}
                        alt="img of user"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 
                                           shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={`/users/${session?.user.name}/`} className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link 

                            href="#"
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          >
                            Settings
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            onClick = { async () => 
                              {
                                  await signOut();
                                  window.location.href = '/';
                              }}
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 cursor-pointer')}
                          >
                            Sign out
                          </a>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>     
              </div>
              )} 
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}






