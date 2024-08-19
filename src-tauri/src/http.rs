use std::{sync::Mutex, thread};
use lazy_static::lazy_static;
use tiny_http::{Header, Request, Response, ResponseBox};

struct HttpServer {
    otp_code: String,
    json_data: String,
    server: tiny_http::Server,
    connection_openned: bool
}

impl HttpServer {
    fn new() -> Self {
        Self {
            otp_code: String::new(),
            json_data: String::new(),
            server: tiny_http::Server::http("0.0.0.0:9099").unwrap(),
            connection_openned: true
        }
    }

    fn start_server(&mut self, otp_code: String, backup_data: String) {
        self.otp_code = otp_code;
        self.json_data = backup_data;

        if !self.connection_is_open() {
            dbg!("Connection was closed. Creating a new connection");
            self.server = tiny_http::Server::http("0.0.0.0:9099").unwrap();
        }

        loop {
            // waits for the handshake connection
            let request = match self.server.recv() {
                Ok(req) => {
                    let method = req.method().as_str();
                    if method != "POST" && method != "OPTIONS" {
                        dbg!("Wrong url or method");
                        // without a response, tiny_http returns a 505 HTTP ERROR
                        continue;
                    }
                    req
                }
                Err(_err) => {
                    dbg!("Couldn't receive the request. {:?}", _err);
                    return;
                }
            };
            let response = self.handle_incoming_request(&request);

            if let Some(response) = response {
                let _ = request.respond(response);
                continue;
            } else {
                // finishes the listening loop
                break;
            }
        }
    }

    fn handle_incoming_request(&mut self, request: &Request) -> Option<ResponseBox> {
        if request.method().as_str() == "OPTIONS" {
            dbg!("Received a OPTIONS method");
            let response = self.response_with_cors_headers("");
            dbg!("Returned the response");
            return response;
        }

        if request.url() == "/handshake" {
            dbg!("Received a POST method on /handshake url");
            return self.handshake(request);
        }

        if request.url() == "/disconnect" {
            dbg!("Received the disconnect command");
            self.close();

            return None;
        }
        None
    }

    fn handshake(&mut self, request: &Request) -> Option<ResponseBox> {
        let otp_token = request
            .headers()
            .into_iter()
            .find_map(|header| {
                dbg!(
                    "Header {:?} with value {:?}",
                    header.field.as_str(),
                    header.value.as_str()
                );
                if header.field.as_str() == "X-SIGNED-TOKEN" {
                    dbg!("Returned the header {:?}", header.value.as_str());
                    return Some(header.value.as_str());
                }
                None
            })
            .unwrap();
        dbg!("Valor to token: {:?}", &otp_token);

        if otp_token.len() == 0 {
            let response = Response::from_string("Empty token".to_string())
                .with_status_code(500)
                .boxed();
            return Some(response);
        }
        let json_data2 = self.json_data.clone();
        let json_data_str = json_data2.as_str();
        self.response_with_cors_headers(json_data_str)
    }

    fn response_with_cors_headers(&mut self, resp: &str) -> Option<ResponseBox> {
        let header1 = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap();
        let header2 = Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"*"[..]).unwrap();
        // received the otp, now we're going to respond with the encrypted json
        let response = Response::from_string(resp)
            .with_header(header1)
            .with_header(header2)
            .boxed();
        Some(response)
    }

    fn close(&mut self) {
        dbg!("Fechando a conexão");
        self.server.unblock();
        self.connection_openned = true;
        //std::mem::drop(self.server);
    }

    fn connection_is_open(&self) -> bool {
        self.connection_openned
    }
}

lazy_static! {
    static ref SERVER_HANDLE: Mutex<HttpServer> = Mutex::new(HttpServer::new());
}

#[tauri::command]
pub fn start_http_server(otp_code: String, backup_data: String) {
    thread::spawn(|| {
        SERVER_HANDLE.lock().unwrap().start_server(otp_code, backup_data);
    });
}

