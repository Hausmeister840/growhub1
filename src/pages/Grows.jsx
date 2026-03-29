import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Grows() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('GrowDiaries'), { replace: true });
  }, [navigate]);

  return null;
}