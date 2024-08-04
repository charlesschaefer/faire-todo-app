use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use local_ip_address::local_ip;



pub async fn discover_service() -> String {
    // Create a daemon
    let mdns = ServiceDaemon::new().expect("Failed to create daemon");

    // Browse for a service type.
    let service_type = "_faire._udp.local.";
    let receiver = mdns.browse(service_type).expect("Failed to browse");

    let my_ip = local_ip().unwrap().to_string();

    // Receive the browse events in sync or async. Here is
    // an example of using a thread. Users can call `receiver.recv_async().await`
    // if running in async environment.
    'outer: while let Ok(event) = receiver.recv_async().await {
        match event {
            ServiceEvent::ServiceResolved(info) => {
                dbg!("Resolved a new service: {}", info.get_fullname());
                let addresses_iter = info.get_addresses().into_iter();
                for ip in addresses_iter {
                    if ip.to_string() == my_ip {
                        continue 'outer;
                    }
                }
                
                return info.get_hostname().to_string();
            }
            other_event => {
                dbg!("Received other event: {:?}", &other_event);
            }
        }
    }
    "".to_string()
    // Gracefully shutdown the daemon.
    //std::thread::sleep(std::time::Duration::from_secs(100));
    //mdns.shutdown().unwrap();
}

pub fn broadcast_service() {
    // Create a daemon
    let mdns = ServiceDaemon::new().expect("Failed to create daemon");
    let my_local_ip = local_ip().unwrap();
    let ip_string = my_local_ip.clone().to_string();
    let host = hostname::get().unwrap();
    let mut host_string = host.to_str().unwrap().to_string();
    host_string.push_str(".local.");

    // Create a service info.
    let service_type = "_faire._udp.local.";
    let instance_name = "local";
    let ip = ip_string.as_str();
    let host_name = host_string.as_str();
    let port = 5200;
    let properties = [("property_1", "test"), ("property_2", "1234")];

    let my_service = ServiceInfo::new(
        service_type,
        instance_name,
        host_name,
        ip,
        port,
        &properties[..],
    ).unwrap();
    
    // Register with the daemon, which publishes the service.
    mdns.register(my_service).expect("Failed to register our service");

    dbg!("Registering the service");

    // Gracefully shutdown the daemon
    std::thread::sleep(std::time::Duration::from_secs(1));
    mdns.shutdown().unwrap();
}