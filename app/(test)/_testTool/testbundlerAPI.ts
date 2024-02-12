import { UserOperationType } from '@/app/_types/member'

export async function paymasterSponsorUserOperation(param: UserOperationType) {
  const url = 'http://127.0.0.1:4339/paymaster';
  const data = {
    method: "pm_sponsorUserOperation",
    params: [] as any,
    id: 1
  };
  data.params.push(param)

  try {
      const response = await fetch(url, {
        method: 'POST', // HTTP 요청 메소드
        headers: {
          'Content-Type': 'application/json', // 내용 유형을 JSON으로 설정
          'Cache-Control': 'no-cache', // 캐싱 방지
          'Pragma': 'no-cache'         // HTTP/1.0 캐시 제어
        },
        body: JSON.stringify(data), // JavaScript 객체를 JSON 문자열로 변환
      });
  
      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }
  
      const result = await response.json(); // 응답을 JSON으로 파싱
      return result;
      
    } catch (error) {
      console.error('Failed to send request:', error);
      return null;

    }
}


export async function estimateUserOperationGas(param: UserOperationType) {
    const url = 'http://localhost:3050/rpc';
    const data = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_estimateUserOperationGas",
      params: [] as any
    };
    data.params.push(param)
    data.params.push("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")
    
    try {
        const response = await fetch(url, {
          method: 'POST', // HTTP 요청 메소드
          headers: {
            'Content-Type': 'application/json', // 내용 유형을 JSON으로 설정
            'Cache-Control': 'no-cache', // 캐싱 방지
            'Pragma': 'no-cache'         // HTTP/1.0 캐시 제어
          },
          body: JSON.stringify(data), // JavaScript 객체를 JSON 문자열로 변환
        });
    
        if (!response.ok) {
          throw new Error(`Error! status: ${response.status}`);
        }
    
        const result = await response.json(); // 응답을 JSON으로 파싱
        return result;

      } catch (error) {
        console.error('Failed to send request:', error);
        return null;

      }
}

export async function sendUserOperation(param: UserOperationType) {
  const url = 'http://localhost:3050/rpc';
  const data = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_sendUserOperation",
    params: [] as any
  };
  data.params.push(param)
  data.params.push("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")
  
  try {
      const response = await fetch(url, {
        method: 'POST', // HTTP 요청 메소드
        headers: {
          'Content-Type': 'application/json', // 내용 유형을 JSON으로 설정
          'Cache-Control': 'no-cache', // 캐싱 방지
          'Pragma': 'no-cache'         // HTTP/1.0 캐시 제어
        },
        body: JSON.stringify(data), // JavaScript 객체를 JSON 문자열로 변환
      });
  
      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }
  
      const result = await response.json(); // 응답을 JSON으로 파싱
      return result;

    } catch (error) {
      console.error('Failed to send request:', error);
      return null;

    }
}