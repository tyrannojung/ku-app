'use client'
import { useState, ChangeEvent } from 'react';

export default function Aiwallet() {
  const [domain, setDomain] = useState<string>('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
  };

  const loadDomain = () => {
    const iframe: HTMLIFrameElement | null = document.getElementById('domainIframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = `http://${domain}`;
    }
  };

  return (
    <div>
      <h2>도메인 입력</h2>
      <input
        type="text"
        value={domain}
        onChange={handleInputChange}
        placeholder="도메인을 입력하세요"
      />
      <button onClick={loadDomain}>도메인 불러오기</button>

      <h2>결과</h2>
      <iframe id="domainIframe" style={{ width: '100%', height: '500px' }}></iframe>
    </div>
  );
};
