Obecnie test wprowadzenia 2FA działa, ale przy próbie resignu/ loginu kod z autenticatora nie wchodzi. 
Podstawowe use case:
1. User tworzy konto.
2. Po stworzeniu konta dodaje autoryzacje 2FA.
3. Pobiera dowolną aplikacje na telefon do 2FA.
4. Skanuje kod QR za pomocą aplikacji.
5. Wpisuje kod z applikacji w oknie do autoryzacji (na lokalnym hoście w aplikacji do autoryzacji)
6. Autoryzacja powinna przejśc pomyślnie. 
7. Next step: działający login. 