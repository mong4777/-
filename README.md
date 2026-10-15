# 나만의 저장소

Supabase에 메모와 파일을 저장하는 개인용 웹앱입니다. 로그인한 본인 데이터만 보입니다(RLS).

## 설정
1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `schema.sql` 실행 (테이블 + 비공개 `files` 버킷 + 보안 정책)
3. Project Settings → API의 URL과 anon key를 `config.js`에 입력
4. (개인용이면) Authentication → Providers → Email에서 "Confirm email"을 끄면 가입 즉시 사용 가능
5. 실행: `python3 -m http.server 8000` 후 http://localhost:8000 접속
   (GitHub Pages, Netlify, Vercel 등 정적 호스팅에 그대로 올려도 됩니다)

## 주의
- `service_role` 키는 절대 `config.js`에 넣지 마세요.
- 나만 쓰려면 설정 후 Authentication → Settings에서 "Allow new users to sign up"을 끄세요.
