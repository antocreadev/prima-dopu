import { useState, useEffect } from 'react';
import ZoneMaskEditor from './ZoneMaskEditor';

interface MaskEditorOpenEvent {
  imageUrl: string;
  referenceImage?: string;
}

export default function ZoneMaskEditorWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | undefined>();

  useEffect(() => {
    const handleOpen = (event: CustomEvent<MaskEditorOpenEvent>) => {
      setImageUrl(event.detail.imageUrl);
      setReferenceImage(event.detail.referenceImage);
      setIsOpen(true);
    };

    window.addEventListener('openMaskEditor', handleOpen as EventListener);
    
    return () => {
      window.removeEventListener('openMaskEditor', handleOpen as EventListener);
    };
  }, []);

  const handleSave = (maskDataUrl: string) => {
    window.dispatchEvent(new CustomEvent('maskEditorSave', { detail: { maskDataUrl } }));
    setIsOpen(false);
  };

  const handleCancel = () => {
    window.dispatchEvent(new CustomEvent('maskEditorCancel'));
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <ZoneMaskEditor
      imageUrl={imageUrl}
      referenceImage={referenceImage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
