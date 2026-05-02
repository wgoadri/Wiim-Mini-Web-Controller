WIIM_MINI_IP="192.168.1.13"

curl -k "https://$WIIM_MINI_IP/httpapi.asp?command=getStatusEx"
curl -k "https://$WIIM_MINI_IP/httpapi.asp?command=getPlayerStatus"