import {Button as MantineButton} from '@mantine/core';
import styled from 'styled-components';

const StyledButton = styled(MantineButton)`
  // Add project-specific styles here if needed
  // For example:
  // border-radius: 30px;
`;

export const Button = (props) => {
  return <StyledButton {...props} />;
};
