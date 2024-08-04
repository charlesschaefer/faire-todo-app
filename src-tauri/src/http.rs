use std::thread;

use tiny_http::{Request, Response, ResponseBox, Header};

#[tauri::command]
pub fn start_http_server() {
    thread::spawn(|| {
        start_server();
    });
}


fn start_server() {
    
    let server = tiny_http::Server::http("0.0.0.0:9099").unwrap();
    
    loop {
        // waits for the handshake connection
        let request = match server.recv() {
            Ok(req) => {
                let method = req.method().as_str();
                if method != "POST" && method != "OPTIONS" {
                    dbg!("Wrong url or method");
                    // without a response, tiny_http returns a 505 HTTP ERROR
                    continue;
                }
                req
            },
            Err(_err) => {
                dbg!("Couldn't receive the request.");
                return ;
            }
        };
        let response = handle_incoming_request(&request);
        
        if let Some(response) = response {
            let _ = request.respond(response);
            continue;
        }

    }
}

fn handle_incoming_request(request: &Request) -> Option<ResponseBox> {
    if request.method().as_str() == "OPTIONS" {
        dbg!("Received a OPTIONS method");
        let response = response_with_cors_headers("");
        dbg!("Returned the response");
        return response;
    }
    if request.url() == "/handshake" {
        dbg!("Received a POST method on /handshake url");
        return handshake(request);
    }
    None
}

fn handshake(request: &Request) -> Option<ResponseBox> {
    let otp_token = request
        .headers()
        .into_iter()
        .find_map(|header| {
            dbg!("Header {:?} with value {:?}", header.field.as_str(), header.value.as_str());
            if header.field.as_str() == "X-SIGNED-TOKEN" {
                dbg!("Returned the header {:?}", header.value.as_str());
                return Some(header.value.as_str());
            }
            None
        }).unwrap();
    dbg!("Valor to token: {:?}", &otp_token);
    if otp_token.len() == 0 {
        let response = Response::from_string("Empty token".to_string())
                    .with_status_code(500).boxed();
        return Some(response);
    }
    response_with_cors_headers("{\"data\": \"Json data\"}")
}

fn response_with_cors_headers(resp: &str) -> Option<ResponseBox> {
    let header1 = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap();
    let header2 = Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"*"[..]).unwrap();
    // received the otp, now we're going to respond with the encrypted json
    let response = Response::from_string(resp)
        .with_header(header1)
        .with_header(header2)
        .boxed();
    Some(response)
}