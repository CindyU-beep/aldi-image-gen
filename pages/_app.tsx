import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Theme } from '@radix-ui/themes';
import { ToastContainer, Zoom } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useClarity } from '../hooks/useClarity';
import '@radix-ui/themes/styles.css';
import '../styles/globals.css';
import '../styles/generation.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  const auth = useAuth();

  useClarity('s24prqmwzd');

  return (
    auth && (
      <>
        <Theme accentColor="blue" appearance="light" panelBackground="soft">
          <Head>
            <title>ALDI Nord Marketing Studio</title>
            <meta name="description" content="ALDI Nord marketing image generation and campaign visuals" />
            <link rel="icon" href="/aldi-nord.png" />
          </Head>
          <Component {...pageProps} />
          <ToastContainer transition={Zoom} position="top-center" theme="light" closeButton={false} hideProgressBar />
        </Theme>
        <ToastContainer
          transition={Zoom}
          position="top-center"
          theme="light"
          closeButton={false}
          hideProgressBar
        />
      </>
    )
  );
}
