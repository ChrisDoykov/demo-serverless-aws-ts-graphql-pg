#!/bin/bash

# Utility to delete an NS record by its name
delete_ns_record() {
    local hosted_zone_id=$1
    local ns_record_name=$2

    # Retrieve the NS record
    ns_record=$(aws route53 list-resource-record-sets --hosted-zone-id $hosted_zone_id \
                    --query "ResourceRecordSets[?Name == '$ns_record_name.' && Type == 'NS']")

    # Check if the NS record exists
    if [ -z "$ns_record" ]; then
        echo "NS record $ns_record_name not found in hosted zone $hosted_zone_id."
        return
    fi

    # Extract the NS record values and TTL
    ns_record_values=$(echo $ns_record | jq -r '.[0].ResourceRecords[].Value')
    ns_record_ttl=$(echo $ns_record | jq -r '.[0].TTL')

    echo "Deleting NS record $ns_record_name from hosted zone $hosted_zone_id..."

    aws route53 change-resource-record-sets --hosted-zone-id $hosted_zone_id \
        --change-batch '{
            "Changes": [
                {
                    "Action": "DELETE",
                    "ResourceRecordSet": {
                        "Name": "'"$ns_record_name"'",
                        "Type": "NS",
                        "TTL": '"$ns_record_ttl"',
                        "ResourceRecords": '"$(echo "$ns_record_values" | jq -R -s 'split("\n") | map({Value: .}) | .[:4]')"'
                    }
                }
            ]
        }'
    
    # Same as above, this will be logged in both failure and success cases
    # A fail is usually (a soft fail) due to the NS record just not existing in the first place (which is fine)
    echo "NS Record Deleteion op for $ns_record_name has finished."
}

# Utility to retrieve a hosted zone id using its name
get_hosted_zone_id() {
    local hosted_zone_name=$1

    hosted_zone_id=$(aws route53 list-hosted-zones-by-name \
                        --dns-name $hosted_zone_name \
                        --query "HostedZones[0].Id" \
                        --output text)

    echo $hosted_zone_id
}

if [ "$TF_VAR_environment" = "production" ]; then
    echo "Running on production environment..."

    # Delete the NS record binding app.example.com to example.com
    delete_ns_record $TF_VAR_tld_zone_id $TF_VAR_domain_name
else
    echo "Running on non-production environment..."

    hosted_zone_name=$TF_VAR_domain_name # e.g. app.example.com
    ns_record_name="$TF_VAR_environment.$TF_VAR_domain_name" # e.g. ${stage}.app.example.com

    # Fetch the ID of the hosted zone
    hosted_zone_id=$(get_hosted_zone_id "$hosted_zone_name")

    # Delete the NS record binding ${stage}.app.example.com to app.example.com
    delete_ns_record $hosted_zone_id $ns_record_name
fi


