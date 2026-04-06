import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

type BillDueSoonEmailProps = {
    recipientName: string;
    billTitle: string;
    dueDate: string;
};

export function BillDueSoonEmail({
    recipientName,
    billTitle,
    dueDate,
}: BillDueSoonEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>{billTitle} is due soon</Preview>
            <Body style={{ backgroundColor: "#052e16", color: "#ffffff" }}>
                <Container style={{ padding: "24px" }}>
                    <Heading>{recipientName}, your bill is nearly due</Heading>
                    <Section>
                        <Text>{billTitle}</Text>
                        <Text>Due date: {dueDate}</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}
