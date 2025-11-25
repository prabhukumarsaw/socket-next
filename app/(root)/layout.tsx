
import { Footer } from '@/components/home/Footer/footer';
import { Navbar } from '@/components/home/Header/Navbar';
import { getCachedPublicMenusTree } from '@/services/menu.service';

import React, { Suspense } from 'react';

export default async function HomeLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Fetch menus server-side for faster initial load
  const menus = await getCachedPublicMenusTree();

  return (
    <>

      <Navbar menus={menus} />
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
      <Footer />

    </>
  )
}
