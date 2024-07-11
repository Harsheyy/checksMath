import CheckIcon from './Check.svg'

interface CheckProps {
  color?: string;
  stroke?: string;
}

const Check: React.FC<CheckProps> = ({ color = 'black', stroke =  'none' }) => {
  return <CheckIcon style={{ color: color, stroke: stroke }} />;
};

export default Check;