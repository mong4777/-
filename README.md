# 나만의 저장소

Supabase에 메모와 파일을 저장하는 개인용 웹앱입니다. 로그인 없음.
브라우저(localStorage)가 아니라 Supabase에 저장되므로 폰/PC 어디서 열어도 같은 데이터가 보입니다.

## 설정
1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `schema.sql` 실행
3. Project Settings → API의 URL과 anon key를 `config.js`에 입력
4. 실행: `python3 -m http.server 8000` 후 http://localhost:8000 (또는 Netlify/Vercel/GitHub Pages에 배포)

## 보안 주의 (로그인이 없기 때문에)
anon key는 페이지 소스에 그대로 보이므로, **이 앱 주소와 키를 아는 사람은 누구나 데이터를 읽고 쓸 수 있습니다.**
- 주소를 남에게 공유하지 마세요. 민감한 정보(비밀번호, 주민번호 등)는 저장하지 마세요.
- 나중에 막고 싶으면 로그인(Supabase Auth)을 추가하고 `schema.sql`의 정책을 `auth.uid()` 기준으로 바꾸면 됩니다.
