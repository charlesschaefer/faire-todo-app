use tiny_http::{Request, Response, ResponseBox, Header};

#[tauri::command]
pub fn start_http_server() {
    start_server();
    
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
        let header1 = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap();
        let header2 = Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"*"[..]).unwrap();
        let response = Response::from_string("")
            .with_header(header1)
            .with_header(header2)
            .boxed();
        return Some(response);
    }
    if request.url() == "/handshake" {
        return handshake(request);
    }
    None
}

fn handshake(request: &Request) -> Option<ResponseBox> {
    let otp_token = request
        .headers()
        .into_iter()
        .find_map(|header| {
            if header.field.as_str() == "X-SIGNED-TOKEN" {
                return Some(header.value.as_str());
            }
            Some("")
        }).unwrap();

    if otp_token.len() == 0 {
        let response = Response::from_string("Empty token".to_string())
                    .with_status_code(500).boxed();
        return Some(response);
    }
    // received the otp, now we're going to respond with the encrypted json
    let response = Response::from_string("{\"data\": \"Json data\"}").boxed();
    Some(response)
}
