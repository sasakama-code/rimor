
          export class AuthService {
            login(username: string, password: string): boolean {
              // SQLインジェクションの脆弱性
              const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
              // データベース実行（簡略化）
              console.log(query);
              return true;
            }
          }
        