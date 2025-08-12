import React from 'react';
import {AppShell, Burger, Group, Skeleton} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';

function Layout({ children }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          {/* <MantineLogo size={30} /> */}
          {/* 여기에 로고나 앱 타이틀을 넣을 수 있습니다. */}
          <Text size="xl" fw={700}>Liar Game</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {/* <NavLink label="Home" component={Link} to="/" /> */}
        {/* 여기에 네비게이션 링크를 넣을 수 있습니다. */}
        <Skeleton h={28} mt="sm" animate={false} />
        <Skeleton h={28} mt="sm" animate={false} />
        <Skeleton h={28} mt="sm" animate={false} />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

export default Layout;
