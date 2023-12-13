declare global {
    var _mongo: Promise<MongoClient> | undefined;
}

//가짜  export를 넣어서 외부 모듈로 인식시킬 수 있다.
export {};