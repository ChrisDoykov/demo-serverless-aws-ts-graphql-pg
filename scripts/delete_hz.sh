#!/bin/bash

# Utility to delete a CNAME record from a hosted zone
delete_cname_record() {
    local hosted_zone_id=$1

    # Retrieve the CNAME record
    # Usually by this point in the flow
    # there should only be the SOA and NS records left
    # along with the ACM verification CNAME (so only one of Type == 'CNAME')
    cname_record=$(aws route53 list-resource-record-sets --hosted-zone-id $hosted_zone_id \
                    --query "ResourceRecordSets[?Type == 'CNAME']")

    # Check if the CNAME record exists
    if [ -z "$cname_record" ]; then
        echo "No CNAME record was found in hosted zone $hosted_zone_id."
        return
    fi

    # Extract CNAME record value, name, and TTL
    cname_record_name=$(echo $cname_record | jq -r '.[0].Name')
    cname_record_value=$(echo $cname_record | jq -r '.[0].ResourceRecords[].Value')
    cname_record_ttl=$(echo $cname_record | jq -r '.[0].TTL')

    echo "Deleting CNAME record $cname_record_name from hosted zone $hosted_zone_id..."

    aws route53 change-resource-record-sets --hosted-zone-id $hosted_zone_id \
        --change-batch '{
            "Changes": [
                {
                    "Action": "DELETE",
                    "ResourceRecordSet": {
                        "Name": "'"$cname_record_name"'",
                        "Type": "CNAME",
                        "TTL": '"$cname_record_ttl"',
                        "ResourceRecords": [{"Value": "'"$cname_record_value"'"}]
                    }
                }
            ]
        }'

    # This will be logged in both failure and success cases to signify the end of the op.
    # When the script fails this is usually (a soft fail) due to the record just not existing in the first place (which is fine)
    echo "CNAME Record Deleteion op for record $cname_record_name has finished."
}

# Utility to delete a hosted zone by name
delete_hosted_zone() {
    local hosted_zone_name=$1

    # Get the hosted zone ID using the name
    hosted_zone_id=$(aws route53 list-hosted-zones-by-name \
                        --dns-name $hosted_zone_name \
                        --query "HostedZones[0].Id" \
                        --output text)

    if [ -z "$hosted_zone_id" ]; then
        echo "Hosted zone $hosted_zone_name not found."
        return
    fi

    echo "Deleting hosted zone $hosted_zone_name (ID: $hosted_zone_id)..."

    aws route53 delete-hosted-zone --id $hosted_zone_id

    # Same as above, this will be logged in both failure and success cases
    # A fail is usually (a soft fail) due to the hosted zone just not existing in the first place (which is fine)
    echo "Hosted Zone Deletion op for $hosted_zone_name has finished."
}

if [ "$TF_VAR_environment" = "production" ]; then
    echo "Running on production environment..."

    # Get the hosted zone ID using its name
    hosted_zone_id=$(aws route53 list-hosted-zones-by-name \
                        --dns-name $TF_VAR_domain_name \
                        --query "HostedZones[0].Id" \
                        --output text)

    # Delete ACM certificate validation record first
    # This is because a hosted zone must only hold
    # the original SOA and NS records
    # as it did upon creation in order to be deleted successfully
    delete_cname_record "$hosted_zone_id"

    # Delete the hosted zone for app.example.com
    delete_hosted_zone "$TF_VAR_domain_name"
else
    echo "Running on non-production environment..."

    # Delete the hosted zone for ${stage}.app.example.com
    delete_hosted_zone "$TF_VAR_environment.$TF_VAR_domain_name"
fi
