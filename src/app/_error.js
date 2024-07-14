import { useEffect } from 'react';

function Error({ statusCode, err }) {
  useEffect(() => {
    // Log the error to the console
    console.error('Next.js Error:', err);
  }, [err]);

  return (
    <p>
      {statusCode
        ? `An error ${statusCode} occurred on server`
        : 'An error occurred on client'}
    </p>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, err };
};

export default Error;