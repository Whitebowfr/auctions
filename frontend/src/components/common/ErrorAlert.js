import { Alert, AlertTitle, Button, Box } from '@mui/material';

const ErrorAlert = ({ error, onRetry, title = 'Error' }) => {
  return (
    <Alert 
      severity="error" 
      sx={{ 
        borderRadius: '12px',
        mb: 2
      }}
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {error}
    </Alert>
  );
};

export default ErrorAlert;